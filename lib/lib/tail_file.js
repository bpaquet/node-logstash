var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    events = require('events'),
    spawn = require('child_process').spawn,
    logger = require('log4node');

exports.tail = function(filename, options) {
  return new Tailer(filename, options || {})
}

function Tailer(filename, options) {
  this.filename = path.resolve(filename);
  this.options = options;
}

util.inherits(Tailer, events.EventEmitter);

function split_buffer(buffer, callback) {
  var data = buffer.toString();
  while(true) {
    var index = data.indexOf('\n');
    if (index == -1) {
      break;
    }
    if (index > 0) {
      callback(data.slice(0, index));
    }
    data = data.slice(index + 1);
  }
}
Tailer.prototype.tail = function(x) {
  logger.debug('Launching tail -f on', this.filename);
  this.child = spawn(this.tail_path || 'tail', ['-f', '-n', x, this.filename]);
  this.child.stdout.on('data', function(data) {
    split_buffer(data, function(line) {
      this.emit('data', line);
    }.bind(this));
  }.bind(this));
  this.child.stderr.on('data', function(data) {
    split_buffer(data, function(line) {
      logger.error(line);
    }.bind(this));
  }.bind(this));
}

Tailer.prototype.start = function(start_index) {
  fs.exists(this.filename, function(exists) {
    if (exists) {
      this.tail(0);
    }
    else {
      try {
        this.dir = path.dirname(this.filename);
        var basename = path.basename(this.filename);
        logger.info('Watching dir', this.dir, 'for file', basename);
        this.dir_watcher = fs.watch(this.dir, function(event, filename) {
          if (event == 'change' && basename == filename && ! this.child) {
            this.tail(2000);
          }
        }.bind(this));
      }
      catch(err) {
        logger.error('Unable to monitor', this.dir, ':', err);
        this.emit('init_error', 'Unable to start directory monitor on ' + this.dir + ' : ' + err);
      }
    }
  }.bind(this));
}

Tailer.prototype.close = function(callback) {
  if (this.child) {
    logger.debug('Killing tail process on', this.filename);
    this.child.kill();
    this.child = undefined;
  }
  if (this.dir_watcher) {
    logger.debug('Closing directory monitoring for', this.dir);
    this.dir_watcher.close();
    this.dir_watcher = undefined;
  }
  callback();
}