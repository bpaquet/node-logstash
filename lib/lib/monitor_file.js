var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    events = require('events'),
    logger = require('log4node');

var file_status = {};

exports.setFileStatus = function(m) {
  file_status = m;
}

exports.getFileStatus = function() {
  return file_status;
}

exports.monitor = function(filename, options) {
  return new MonitoredFile(filename, options || {})
}

function MonitoredFile(filename, options) {
  this.filename = path.resolve(filename);
  this.options = options;
  this.fdTailer = undefined;
  this.open_in_progress = false;
  this.oldFdTailers = [];
  this.wait_delay_after_renaming = this.options.wait_delay_after_renaming || 5000;
}

util.inherits(MonitoredFile, events.EventEmitter);

MonitoredFile.prototype.close = function(callback) {
  var close_old_fd_tailers = function() {
    if (this.oldFdTailers.length == 0) {
      return callback();
    }
    clearTimeout(this.oldFdTailers[0].id);
    this.oldFdTailers[0].f(close_old_fd_tailers);
  }.bind(this);
  logger.info('Closing monitoring for', this.filename);
  if (this.dir_watcher) {
    logger.debug('Closing directory monitoring for', this.dir);
    this.dir_watcher.close();
    this.dir_watcher = undefined;
  }
  if (this.fdTailer) {
    this.fdTailer.close(function(last_data) {
      file_status[this.filename] = {
        last_data: last_data,
        index: this.fdTailer.current_index,
      };
      close_old_fd_tailers();
    }.bind(this));
  }
  else {
    close_old_fd_tailers();
  }
}

MonitoredFile.prototype.start = function(start_index) {
  logger.info('Starting monitoring', this.filename);
  this.watch();
  this.restart(start_index);
  this.on('renamed', function() {
    if (this.fdTailer) {
      logger.info('File', this.filename, 'renamed');
      var currentFdTailer = this.fdTailer;
      var close_func = function(callback) {
        logger.debug('Now closing postponed', currentFdTailer.fd);
        currentFdTailer.close(function() {
          if (callback) {
            callback();
          }
        });
        var index = -1;
        for(var i = 0; i < this.oldFdTailers.length; i ++) {
          if (this.oldFdTailers[i].fdTailer == currentFdTailer) {
            index = i;
          }
        }
        if (index != -1) {
          this.oldFdTailers.splice(index, 1);
        }
      }.bind(this);
      var id = setTimeout(close_func, this.wait_delay_after_renaming);
      this.oldFdTailers.push({fdTailer: currentFdTailer, id: id, f: close_func});
      this.fdTailer = undefined;
      file_status[this.filename] = undefined;
      this.restart(0);
    }
    else {
      logger.debug('Reopen file', this.filename, 'from 0 after renaming');
      this.restart(0);
    }
  });
  this.on('changed', function() {
    if (this.fdTailer) {
      logger.debug('File', this.filename, 'changed');
      this.fdTailer.read(function() {
        var last_data = this.fdTailer.last_data;
        if (last_data) {
          var buffer =  new Buffer(last_data.length);
          fs.read(this.fdTailer.fd, buffer, 0, last_data.length, this.fdTailer.current_index - last_data.length, function(err, bytesRead, buffer) {
            if (err) {
              return this.emit('error', err);
            }
            if (bytesRead == last_data.length && last_data == buffer.toString(this.options.buffer_encoding || 'ascii', 0, last_data.length)) {
              logger.info('Event changed received, but no data change and last data match', this.filename, 'fd', this.fdTailer.fd);
            }
            else {
              logger.info('Event changed received, but no data change and last data does not match.', 'Restarting reading', this.filename, 'at 0 fd', this.fdTailer.fd);
              this.restart(0);
            }
          }.bind(this));
        }
      }.bind(this));
    }
    else {
      if (this.last_open_failed) {
        this.restart(0);
      }
    }
  });
  this.on('other_changed', function(filename) {
    if (this.oldFdTailers.length > 0) {
      logger.debug('Something else has changed in directory and we are monitoring an old file for', this.filename);
      this.oldFdTailers.forEach(function(o) {
        o.fdTailer.read();
      });
    }
    else {
      logger.debug('Unprocessed event while monitoring', this.filename, ':', 'changed', filename);
    }
  });
}

MonitoredFile.prototype.restart = function(start_index) {
  if (this.fdTailer) {
    this.fdTailer.close();
    this.fdTailer = undefined;
  }
  if (this.open_in_progress) {
    logger.debug('Postponing file opening', this.filename);
    this.need_open_after_open = true;
    this.need_open_after_open_start_index = start_index;
  }
  else {
    this.open_in_progress = true;
    this.need_open_after_open = false;
    this.last_open_failed = false;
    fs.exists(this.filename, function(exists) {
      if (exists) {
        logger.debug('Open file for reading', this.filename);
        fs.open(this.filename, 'r', function(err, fd) {
          this.open_in_progress = false;
          if (err) {
            this.last_open_failed = true;
            return this.emit('error', err);
          }
          this.to_be_processed = '';
          fs.fstat(fd, function(err, stats) {
            if (err) {
              return this.emit('error', err);
            }
            if (stats.isFIFO()) {
              logger.info('File', this.filename, 'is a FIFO pipe');
            }
            // Some data about file in db_file ?
            if (file_status[this.filename] && file_status[this.filename].last_data && file_status[this.filename].index) {
              var last_data = file_status[this.filename].last_data;
              // Enough data to check last_data ?
              if (file_status[this.filename].index >= last_data.length && stats.size > last_data.length) {
                var buffer =  new Buffer(last_data.length);
                fs.read(fd, buffer, 0, last_data.length, file_status[this.filename].index - last_data.length, function(err, bytesRead, buffer) {
                  if (err) {
                    return this.emit('error', err);
                  }
                  if (bytesRead == last_data.length && last_data == buffer.toString(this.options.buffer_encoding || 'ascii', 0, last_data.length)) {
                    logger.info('Start from last read index', this.filename, 'at', file_status[this.filename].index, 'fd', fd);
                    this.fdTailer = new FdTailer(fd, file_status[this.filename].index, this.options, stats.isFIFO(), this);
                    this.fdTailer.read();
                  }
                  else {
                    logger.info('Have last read index, but last data are not correct.', 'Start reading', this.filename, 'at end fd', fd);
                    this.fdTailer = new FdTailer(fd, stats.size, this.options, stats.isFIFO(), this);
                    this.fdTailer.read();
                  }
                }.bind(this));
              }
              else {
                logger.info('Have last read index, but file is too small.', 'Start reading', this.filename, 'at end fd', fd);
                this.fdTailer = new FdTailer(fd, stats.size, this.options, stats.isFIFO(), this);
                this.fdTailer.read();
              }
            }
            // No data about file, starting normally
            else {
              if (start_index === undefined) {
                logger.info('Start reading', this.filename, 'at end', 'fd', fd);
                this.fdTailer = new FdTailer(fd, stats.size, this.options, stats.isFIFO(), this);
              }
              else {
                logger.info('Start reading', this.filename, 'at', start_index, 'fd', fd);
                this.fdTailer = new FdTailer(fd, start_index, this.options, stats.isFIFO(), this);
                this.fdTailer.read();
              }
            }
          }.bind(this));
        }.bind(this));
      }
      else {
        this.open_in_progress = false;
        logger.info('File does not exist', this.filename);
        if (this.need_open_after_open) {
          logger.debug('Relaunching open for', this.filename, 'at', this.need_open_after_open_start_index);
          this.restart(this.need_open_after_open_start_index);
        }
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.watch = function() {
  try {
    this.dir = path.dirname(this.filename);
    var basename = path.basename(this.filename);
    logger.info('Watching dir', this.dir, 'for file', basename);
    this.dir_watcher = fs.watch(this.dir, function(event, filename) {
      logger.debug('Event received for', this.filename, ':', event, filename);
      if (event == 'rename' && basename == filename) {
        this.emit('renamed');
      }
      else if (event == 'change' && basename == filename) {
        this.emit('changed');
      }
      else if (event == 'change') {
        this.emit('other_changed', filename);
      }
      else {
        logger.debug('Unprocessed event while monitoring', this.filename, ':', event, filename);
      }
    }.bind(this));
  }
  catch(err) {
    logger.error('Unable to monitor', this.dir, ':', err);
    this.emit('init_error', 'Unable to start directory monitor on ' + this.dir + ' : ' + err);
  }
}

function FdTailer(fd, current_index, options, is_fifo, event_target) {
  this.fd = fd;
  this.event_target = event_target;
  this.to_be_processed = '';
  this.current_index = current_index;
  this.is_fifo = is_fifo;
  this.buffer =  new Buffer(options.buffer_size || 1024);
  this.buffer_encoding = options.buffer_encoding || 'ascii';
  this.read_in_progress = false;
}

FdTailer.prototype.close = function(callback) {
  logger.info('Closing file', this.fd);
  fs.close(this.fd, function(err) {
    if (callback) {
      this.event_target.emit('closed');
      if (err) {
        this.event_target.emit('error', err);
      }
      callback(this.last_data);
    }
  }.bind(this));
}

FdTailer.prototype.read = function(callback_nothing_read) {
  if (!this.fd) {
    return;
  }
  if (this.read_in_progress) {
    this.need_read_after_read = true;
  }
  else {
    this.read_in_progress = true;
    this.need_read_after_read = false;
    var current = this.is_fifo ? -1 : this.current_index;
    logger.debug('Launch reading on', this.fd, ', current_index', current);
    fs.read(this.fd, this.buffer, 0, this.buffer.length, current, function(err, read, buffer) {
      this.read_in_progress = false;
      if (err) {
        return logger.error('Error reading file', this.fd, ':', err);
      }
      if (read == 0 && callback_nothing_read) {
        callback_nothing_read();
      }
      if (read > 0) {
        logger.debug('Read from', this.fd, ':', read, 'bytes');
        this.current_index += read;
        this.handle(read);
        if (read == buffer.length || this.need_read_after_read) {
          process.nextTick(function() {
            this.read();
          }.bind(this));
        }
      }
    }.bind(this));
  }
}

FdTailer.prototype.handle = function(length) {
  this.last_data = this.buffer.toString(this.buffer_encoding, 0, length);
  this.to_be_processed += this.last_data;
  while (true) {
    var index = this.to_be_processed.indexOf('\n');
    if (index == -1) {
      break;
    }
    if (index > 0) {
      var line = this.to_be_processed.slice(0, index);
      this.event_target.emit('data', line);
    }
    this.to_be_processed = this.to_be_processed.slice(index + 1);
  }
}
