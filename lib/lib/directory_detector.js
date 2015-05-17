var events = require('events'),
  logger = require('log4node'),
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  file_filter = require('./file_filter'),
  async = require('async'),
  directory_watcher = require('./directory_watcher');

function DirectoryDetector() {
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
  this.to_be_closed = [];
}

util.inherits(DirectoryDetector, events.EventEmitter);

DirectoryDetector.prototype.start = function(directory, start_callback) {
  var called = false;
  this.parent_start(directory, true, function() {
    if (!called) {
      start_callback();
    }
    called = true;
  });
};

DirectoryDetector.prototype.parent_start = function(directory, first, start_callback) {
  logger.debug('Starting directory detector in directory', directory, first);
  fs.exists(directory, function(exists) {
    if (exists) {
      this.emit('exists', directory, false);
      if (first) {
        start_callback();
      }
      return;
    }
    this.parent = path.resolve(path.join(directory, '..'));
    var filter = file_filter.create(path.basename(directory));
    var parent_detector = new DirectoryDetector();
    parent_detector.on('exists', function(d) {
      logger.debug('Start monitoring', d, 'waiting for', filter);
      try {
        var dir_watcher = directory_watcher.register(d, function(event, filename) {
          if (event === 'rename' && filter.filter(filename)) {
            var f = d + '/' + filename;
            fs.exists(f, function(exists) {
              if (exists) {
                logger.debug('Subdirectory', filename, 'appears in', d);
                this.emit('exists', f, true);
              }
              else {
                this.emit('removed', f);
              }
            }.bind(this));
          }
        }.bind(this));
        this.to_be_closed.push({
          close: function(callback) {
            directory_watcher.unregister(dir_watcher);
            callback();
          }
        });
      }
      catch (err) {
        logger.error('Unable to start watcher on directory', d, err);
        this.emit('error', err);
        return;
      }
      fs.readdir(d, function(err, l) {
        if (err) {
          logger.error('Unable to read directory', d, err);
          this.emit('error', err);
          return;
        }
        start_callback();
        l.forEach(function(filename) {
          if (filter.filter(filename)) {
            logger.info('Subdirectory', filename, 'appears in', d);
            this.emit('exists', d + '/' + filename, true);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
    parent_detector.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
    parent_detector.parent_start(this.parent, false, start_callback);
    this.to_be_closed.push(parent_detector);
  }.bind(this));
};

DirectoryDetector.prototype.close = function(callback) {
  async.eachSeries(this.to_be_closed, function(x, callback) {
    x.close(callback);
  }, callback);
};

exports.DirectoryDetector = DirectoryDetector;
