var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    events = require('events'),
    logger = require('log4node');

module.exports = {
  monitor: function(filename, options) {
    return new MonitoredFile(filename, options)
  }
}

function MonitoredFile(filename, options) {
  this.filename = path.resolve(filename);
  this.options = options;
  this.file_exists = undefined;
  this.buffer =  new Buffer(options.buffer_size || 1024);
  this.options.buffer_encoding |= 'ascii';
}

util.inherits(MonitoredFile, events.EventEmitter);

MonitoredFile.prototype.close = function() {
  if (this.fd) {
    logger.info('Closing file', this.filename);
    fs.close(this.fd, function(err) {
      if (err) {
        return this.emit('error', err);
      }
    }.bind(this));
    this.fd = undefined;
    this.fd_watcher.close();
    this.fd_watcher = undefined;
  }
}

MonitoredFile.prototype.start = function(start_index) {
  logger.info('Starting monitoring', this.filename);
  if (this.fd === undefined) {
    this.file_not_found = undefined;
    fs.exists(this.filename, function(exists) {
      this.file_exists = exists;
      logger.debug('File', this.filename, 'exists:', exists)
      if (exists) {
        logger.info('Open file for reading', this.filename);
        fs.open(this.filename, 'r', function(err, fd) {
          if (err) {
             return this.emit('error', err);
          }
          this.fd = fd;
          this.current_index = undefined;
          this.to_be_processed = "";
          this.fd_watcher = fs.watch(this.filename, function(event) {
            if (event == 'change') {
              this.tail();
            }
            else if (event == 'rename') {
              logger.info('File is renamed:', this.filename);
              this.close();
              this.start(0);
            }
            else {
              this.emit('error', 'Unknown event : ' + event);
            }
          }.bind(this));
          if (start_index === undefined) {
            logger.info('Start reading', this.filename, 'at end');
            fs.fstat(fd, function(err, stats) {
              if (err) {
                 return this.emit('error', err);
              }
              this.current_index = stats.size;
            }.bind(this));
          }
          else {
            logger.info('Start reading', this.filename, 'at', start_index);
            this.current_index = start_index;
            this.tail();
          }
        }.bind(this));
      }
    }.bind(this));
  }
  if (!this.dir_watcher) {
    var dir = path.dirname(this.filename);
    fs.exists(dir, function(exists) {
      if (exists) {
        try {
          this.dir_watcher = fs.watch(dir, function(event) {
            if (event == 'rename') {
              process.nextTick(function() {
                logger.debug('Directory', dir, 'change, old file exist status', this.file_exists);
                if (this.file_exists === false) {
                  this.start(0);
                }
              }.bind(this));
            }
          }.bind(this));
        }
        catch(err) {
          logger.error('Unable to monitor ', dir, ':', err);
          this.emit('init_error', 'Unable to start directory monitor on ' + dir + ' : ' + err);
        }
      }
      else {
        this.emit('init_error', 'Directory not found ' + dir);
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.tail = function(buffers) {
  if (this.fd) {
    fs.read(this.fd, this.buffer, 0, this.buffer.length, this.current_index, function(err, read, buffer) {
      if (err) {
        return logger.error('Error reading file', this.filename, ':', err);
      }
      this.current_index += read;
      this.processData(read);
      if (read == buffer.length) {
        this.tail();
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.processData = function(length) {
  this.to_be_processed += this.buffer.toString(this.options.buffer_encoding, 0, length);
  while (true) {
    index = this.to_be_processed.indexOf('\n');
    if (index == -1) {
      break;
    }
    if (index > 0) {
      this.emit('data', this.to_be_processed.slice(0, index));
    }
    this.to_be_processed = this.to_be_processed.slice(index + 1);
  }
}
