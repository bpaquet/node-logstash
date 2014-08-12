var events = require('events'),
  logger = require('log4node'),
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  directory_watcher = require('./directory_watcher');

function DirectoryDetector() {
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
}

util.inherits(DirectoryDetector, events.EventEmitter);

DirectoryDetector.prototype.start = function(directory, callback) {
  logger.debug('Starting directory detector in directory', directory);
  this.directory = directory;
  fs.exists(this.directory, function(exists) {
    if (exists) {
      this.emit('exists');
      callback();
    }
    else {
      this.emit('not_exists');
      this.parent = path.resolve(path.join(this.directory, '..'));
      this.parent_detector = new DirectoryDetector();
      var local_name = path.basename(this.directory);
      this.parent_detector.on('exists', function() {
        logger.debug('Start monitoring', this.parent, 'waiting for', local_name);
        try {
          this.dir_watcher = directory_watcher.register(this.parent, function(event, filename) {
            if (event === 'rename' && filename === local_name) {
              logger.debug('Subdirectory', local_name, 'appears in', this.parent);
              this.close();
              this.emit('exists');
            }
          }.bind(this));
        }
        catch (e) {
          return callback(e);
        }
        fs.exists(this.directory, function(exists) {
          if (exists) {
            this.close();
            this.emit('exists');
          }
        }.bind(this));
      }.bind(this));
      this.parent_detector.start(this.parent, callback);
    }
  }.bind(this));
};

DirectoryDetector.prototype.close = function() {
  if (this.dir_watcher) {
    logger.debug('Stopping monitoring', this.parent);
    directory_watcher.unregister(this.dir_watcher);
    delete this.dir_watcher;
  }
  if (this.parent_detector) {
    logger.debug('Stopping parent detector');
    this.parent_detector.close();
    delete this.parent_detector;
  }
};

exports.DirectoryDetector = DirectoryDetector;
