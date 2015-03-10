var events = require('events'),
  logger = require('log4node'),
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  file_filter = require('./file_filter'),
  directory_watcher = require('./directory_watcher');

function DirectoryDetector() {
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
}

util.inherits(DirectoryDetector, events.EventEmitter);

DirectoryDetector.prototype.start = function(directory, callback) {
  logger.debug('Starting directory detector in directory', directory);
  fs.exists(directory, function(exists) {
    if (exists) {
      this.emit('exists', directory);
      return callback();
    }
    this.parent = path.resolve(path.join(directory, '..'));
    this.parent_detector = new DirectoryDetector();
    var filter = file_filter.create(path.basename(directory));
    this.parent_detector.on('exists', function(d) {
      logger.debug('Start monitoring', d, 'waiting for', filter);
      try {
        this.dir_watcher = directory_watcher.register(d, function(event, filename) {
          if (event === 'rename' && filter.filter(filename)) {
            logger.info('Subdirectory', filename, 'appears in', d);
            this.emit('exists', d + '/' + filename);
          }
        }.bind(this));
      }
      catch (e) {
        return callback(e);
      }
      // can happen if directory and sub directory are created simultaneously
      fs.readdir(d, function(err, l) {
        if (err) {
          return;
        }
        l.forEach(function(filename) {
          if (filter.filter(filename)) {
            logger.info('Subdirectory', filename, 'appears in', d);
            this.emit('exists', d + '/' + filename);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
    this.parent_detector.start(this.parent, callback);
  }.bind(this));
};

DirectoryDetector.prototype.close = function(callback) {
  if (this.dir_watcher) {
    logger.debug('Stopping monitoring', this.parent);
    directory_watcher.unregister(this.dir_watcher);
    delete this.dir_watcher;
  }
  if (this.parent_detector) {
    logger.debug('Stopping parent detector');
    this.parent_detector.close(callback);
    delete this.parent_detector;
  }
  else {
    return callback();
  }
};

exports.DirectoryDetector = DirectoryDetector;
