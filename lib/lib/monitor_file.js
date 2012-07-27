var fs = require('fs'),
path = require('path'),
Log4Node = require('log4node');

module.exports = {
  monitor: function(filename, error_cb, line_cb, options) {
    return new MonitoredFile(filename, error_cb, line_cb, options)
  }
}

function MonitoredFile(filename, error_cb, line_cb, options) {
  this.filename = path.resolve(filename);
  this.logger = options.logger || new Log4Node('warning');
  this.logger.set_prefix('[FileMonitoring][' + path.basename(this.filename) + '] ');
  this.error_cb = function(err) {
    if (error_cb) {
      this.logger.error(err);
      error_cb(err);
    }
  };
  this.line_cb = line_cb;
  this.options = options;
  this.file_exists = undefined;
  this.buffer =  new Buffer(options.buffer_size || 1024);
  this.options.buffer_encoding |= 'ascii';
}

MonitoredFile.prototype.close = function() {
  if (this.fd) {
    this.logger.info('Closing ' + this.fd);
    fs.close(this.fd, function(err) {
      if (err) {
        this.error_cb(err);
      }
    }.bind(this));
    this.fd = undefined;
    this.fd_watcher.close();
    this.fd_watcher = undefined;
  }
}

MonitoredFile.prototype.start = function(start_index) {
  this.logger.info('Starting monitoring, current fd : ' + this.fd);
  if (this.fd === undefined) {
    this.file_not_found = undefined;
    fs.exists(this.filename, function(exists) {
      this.file_exists = exists;
      this.logger.debug('File exists : ' + exists)
      if (exists) {
        this.logger.info('Open for reading');
        fs.open(this.filename, 'r', function(err, fd) {
          if (err) {
             this.error_cb(err);
          }
          this.fd = fd;
          this.current_index = undefined;
          this.to_be_processed = "";
          this.fd_watcher = fs.watch(this.filename, function(event) {
            if (event == 'change') {
              this.tail();
            }
            else if (event == 'rename') {
              this.logger.info('File is renamed');
              this.close();
              this.start(0);
            }
            else {
              this.error_cb('Unknown event : ' + event);
            }
          }.bind(this));
          if (start_index === undefined) {
            this.logger.info('Start reading at end');
            fs.fstat(fd, function(err, stats) {
              if (err) {
                 this.error_cb(err);
              }
              this.current_index = stats.size;
            }.bind(this));
          }
          else {
            this.logger.info('Start reading at ' + start_index);
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
        this.dir_watcher = fs.watch(dir, function(event) {
          if (event == 'rename') {
            process.nextTick(function() {
              this.logger.info('Directory change, file exists : ' + this.file_exists);
              if (this.file_exists === false) {
                this.start(0);
              }
            }.bind(this));
          }
        }.bind(this));
      }
      else {
        this.error_cb('Directory not found ' + dir);
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.tail = function(buffers) {
  this.logger.debug('Tailing fd : ' + this.fd);
  if (this.fd) {
    fs.read(this.fd, this.buffer, 0, this.buffer.length, this.current_index, function(err, read, buffer) {
      this.current_index += read;
      this.process_data(read);
      if (read == buffer.length) {
        this.tail();
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.process_data = function(length) {
  this.to_be_processed += this.buffer.toString(this.options.buffer_encoding, 0, length);
  while (true) {
    index = this.to_be_processed.indexOf('\n');
    if (index == -1) {
      break;
    }
    if (index > 0) {
      this.line_cb(this.to_be_processed.slice(0, index));
    }
    if (index > this.to_be_processed.length) {
      this.to_be_processed = "";
    }
    else {
      this.to_be_processed = this.to_be_processed.slice(index + 1);
    }
  }
}
