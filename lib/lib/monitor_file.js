var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  events = require('events'),
  logger = require('log4node'),
  async = require('async'),
  async_helper = require('../lib/async_helper'),
  directory_watcher = require('./directory_watcher');

var file_status = {};

exports.setFileStatus = function(m) {
  file_status = m;
};

exports.getFileStatus = function() {
  return file_status;
};

function FdTailer(fd, current_index, buffer_encoding, buffer_size, is_fifo, event_target) {
  this.fd = fd;
  this.event_target = event_target;
  this.to_be_processed = '';
  this.current_index = current_index;
  this.is_fifo = is_fifo;
  this.buffer = new Buffer(buffer_size);
  this.buffer_encoding = buffer_encoding;
  this.read_in_progress = false;
  this.current_ino = undefined;
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
};

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
      if (read === 0 && callback_nothing_read) {
        callback_nothing_read();
      }
      if (read > 0) {
        logger.debug('Read from', this.fd, ':', read, 'bytes');
        this.current_index += read;
        this.handle(read);
        if (read === buffer.length || this.need_read_after_read) {
          process.nextTick(function() {
            this.read();
          }.bind(this));
        }
      }
    }.bind(this));
  }
};

FdTailer.prototype.handle = function(length) {
  this.last_data_raw_length = length;
  this.last_data = this.buffer.toString(this.buffer_encoding, 0, length);
  this.to_be_processed += this.last_data;
  while (true) {
    var index = this.to_be_processed.indexOf('\n');
    if (index === -1) {
      break;
    }
    if (index > 0) {
      var line = this.to_be_processed.slice(0, index);
      this.event_target.emit('data', line);
    }
    this.to_be_processed = this.to_be_processed.slice(index + 1);
  }
};

function MonitoredFile(filename, options) {
  this.filename = path.resolve(filename);
  this.options = options;
  this.fdTailer = undefined;
  this.open_in_progress = false;
  this.oldFdTailers = [];
  this.wait_delay_after_renaming = this.options.wait_delay_after_renaming || 5000;
  this.buffer_encoding = this.options.buffer_encoding || 'utf8';
  this.buffer_size = this.options.buffer_size || 1024;
}

exports.monitor = function(filename, options) {
  return new MonitoredFile(filename, options || {});
};

util.inherits(MonitoredFile, events.EventEmitter);

MonitoredFile.prototype.close = function(callback) {
  logger.info('Closing monitoring for', this.filename);
  if (this.dir_watcher) {
    logger.debug('Closing directory monitoring for', this.dir);
    directory_watcher.unregister(this.dir_watcher);
    delete this.dir_watcher;
  }
  async.eachSeries([function(callback) {
    if (this.fdTailer === undefined) {
      return callback();
    }
    this.fdTailer.close(function(last_data) {
      file_status[this.filename] = {
        last_data: last_data,
        index: this.fdTailer.current_index,
      };
      callback();
    }.bind(this));
  }.bind(this), function(callback) {
    async.eachSeries(this.oldFdTailers, function(fd, callback) {
      clearTimeout(fd.id);
      fd.f(callback);
    }, callback);
  }.bind(this)], async_helper.call(), callback);
};

MonitoredFile.prototype.start = function(callback, start_index) {
  logger.info('Starting monitoring', this.filename);
  this.watch(function(err) {
    if (err) {
      return callback(err);
    }
    this.on('renamed', function() {
      if (this.fdTailer) {
        logger.info('File', this.filename, 'renamed');
        var old_ino = this.current_ino;
        var currentFdTailer = this.fdTailer;
        var close_func = function(callback) {
          logger.debug('Now closing postponed', currentFdTailer.fd);
          currentFdTailer.close(function() {
            if (callback) {
              callback();
            }
          });
          var index = -1;
          for (var i = 0; i < this.oldFdTailers.length; i++) {
            if (this.oldFdTailers[i].fdTailer === currentFdTailer) {
              index = i;
            }
          }
          if (index !== -1) {
            this.oldFdTailers.splice(index, 1);
          }
        }.bind(this);
        var id = setTimeout(close_func, this.wait_delay_after_renaming);
        this.oldFdTailers.push({
          fdTailer: currentFdTailer,
          id: id,
          f: close_func
        });
        this.fdTailer = undefined;
        file_status[this.filename] = undefined;
        this.restart(0, function(err) {
          if (err) {
            return;
          }
          if (this.current_ino === old_ino) {
            // same file, closing old now
            logger.info('Have reopen the same file, closing old fd now instead of waiting', this.wait_delay_after_renaming);
            clearTimeout(id);
            close_func();
          }
        }.bind(this));
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
          var last_data_length = this.fdTailer.last_data_raw_length;
          if (last_data) {
            var buffer = new Buffer(last_data_length);
            fs.read(this.fdTailer.fd, buffer, 0, last_data_length, this.fdTailer.current_index - last_data_length, function(err, bytesRead, buffer) {
              if (err) {
                return this.emit('error', err);
              }
              if (bytesRead === last_data_length && last_data === buffer.toString(this.buffer_encoding, 0, last_data_length)) {
                logger.debug('Event changed received, but no data change and last data match', this.filename, 'fd', this.fdTailer.fd);
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
    this.restart(start_index, callback);
  }.bind(this));
};

MonitoredFile.prototype.restart = function(start_index, final_callback) {
  if (this.fdTailer) {
    this.fdTailer.close();
    delete this.fdTailer;
  }
  if (this.open_in_progress) {
    logger.debug('Postponing file opening', this.filename);
    this.need_open_after_open = true;
    this.need_open_after_open_start_index = start_index;
    if (final_callback) {
      return final_callback(new Error('Open already in progress'));
    }
  }
  else {
    var final_callback_called = false;
    var callback = function(err) {
      if (final_callback) {
        if (!final_callback_called) {
          final_callback_called = true;
          final_callback(err);
        }
        return;
      }
      if (err) {
        this.emit('error', err);
      }
    }.bind(this);
    this.open_in_progress = true;
    this.need_open_after_open = false;
    this.last_open_failed = false;
    this.current_ino = undefined;
    fs.exists(this.filename, function(exists) {
      if (exists) {
        logger.debug('Open file for reading', this.filename);
        fs.stat(this.filename, function(err, stats) {
          if (err) {
            return callback(err);
          }
          if (stats.isFIFO()) {
            logger.info('File', this.filename, 'is a FIFO pipe');
            // nodeJS fs.open on a FIFO pipe callback is only called when some data arrive
            // we can not wait to inform called init is done
            callback();
          }
          this.current_ino = stats.ino;
          fs.open(this.filename, 'r', function(err, fd) {
            this.open_in_progress = false;
            if (err) {
              this.last_open_failed = true;
              return callback(err);
            }
            this.to_be_processed = '';
            // Some data about file in db_file ?
            if (file_status[this.filename] && file_status[this.filename].last_data && file_status[this.filename].index) {
              var last_data = file_status[this.filename].last_data;
              // Enough data to check last_data ?
              if (file_status[this.filename].index >= last_data.length && stats.size > last_data.length) {
                var buffer = new Buffer(last_data.length);
                fs.read(fd, buffer, 0, last_data.length, file_status[this.filename].index - last_data.length, function(err, bytesRead, buffer) {
                  if (err) {
                    return callback(err);
                  }
                  if (bytesRead === last_data.length && last_data === buffer.toString(this.buffer_encoding, 0, last_data.length)) {
                    logger.info('Start from last read index', this.filename, 'at', file_status[this.filename].index, 'fd', fd);
                    this.fdTailer = new FdTailer(fd, file_status[this.filename].index, this.buffer_encoding, this.buffer_size, stats.isFIFO(), this);
                    this.fdTailer.read();
                  }
                  else {
                    logger.info('Have last read index, but last data are not correct.', 'Start reading', this.filename, 'at end fd', fd);
                    this.fdTailer = new FdTailer(fd, stats.size, this.buffer_encoding, this.buffer_size, stats.isFIFO(), this);
                    this.fdTailer.read();
                  }
                  callback();
                }.bind(this));
              }
              else {
                logger.info('Have last read index, but file is too small.', 'Start reading', this.filename, 'at end fd', fd);
                this.fdTailer = new FdTailer(fd, stats.size, this.buffer_encoding, this.buffer_size, stats.isFIFO(), this);
                this.fdTailer.read();
                callback();
              }
            }
            // No data about file, starting normally
            else {
              if (start_index === undefined) {
                logger.info('Start reading', this.filename, 'at end', 'fd', fd);
                this.fdTailer = new FdTailer(fd, stats.size, this.buffer_encoding, this.buffer_size, stats.isFIFO(), this);
              }
              else {
                logger.info('Start reading', this.filename, 'at', start_index, 'fd', fd);
                this.fdTailer = new FdTailer(fd, start_index, this.buffer_encoding, this.buffer_size, stats.isFIFO(), this);
                this.fdTailer.read();
              }
              callback();
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
        callback();
      }
    }.bind(this));
  }
};

MonitoredFile.prototype.watch = function(callback) {
  try {
    this.dir = path.dirname(this.filename);
    var basename = path.basename(this.filename);
    logger.info('Watching dir', this.dir, 'for file', basename);
    this.dir_watcher = directory_watcher.register(this.dir, function(event, filename) {
      logger.debug('Event received for', this.filename, ':', event, filename);
      if (event === 'rename' && basename === filename) {
        this.emit('renamed');
      }
      else if (event === 'change' && basename === filename) {
        this.emit('changed');
      }
      else if (event === 'change') {
        this.emit('other_changed', filename);
      }
      else {
        logger.debug('Unprocessed event while monitoring', this.filename, ':', event, filename);
      }
    }.bind(this));
    callback();
  }
  catch (err) {
    logger.error('Unable to monitor', this.dir, ':', err);
    callback(err);
  }
};
