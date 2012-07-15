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
  this.logger = new Log4Node(options.log_level || 'warning');
  this.logger.set_prefix("[FileMonitoring][" + path.basename(this.filename) + "] ");
  this.error_cb = function(err) {
    if (error_cb) {
      error_cb(err);
    }
  };
  this.line_cb = line_cb;
  this.options = options;
  this.options.buffer_size |= 1024;
}

MonitoredFile.prototype.close = function() {
  if (this.fd) {
    this.logger.info("Closing " + this.fd);
    fs.close(this.fd, function(err) {
      if (err) {
        this.error_cb(err);
      }
      this.fd = undefined;
    }.bind(this));
    this.fd_watcher.close();
    this.fd_watcher = undefined;
  }
}

MonitoredFile.prototype.start = function(start_index) {
  this.logger.info('Starting monitoring');
  if (!this.fd) {
    fs.exists(this.filename, function(exists) {
      if (exists) {
        this.logger.info("Open for reading");
        fs.open(this.filename, 'r', function(err, fd) {
          if (err) {
             this.error_cb(err);
          }
          this.fd = fd;
          this.current_index = undefined;
          this.fd_watcher = fs.watch(this.filename, function(event) {
            if (event == 'change') {
              this.tail();
            }
            else if (event == 'rename') {
              this.logger.info("File is renamed");
              this.close();
            }
            else {
              this.error_cb("Unknown event : " + event);
            }
          }.bind(this));
          if (start_index === undefined) {
            this.logger.info("Start reading at end");
            fs.fstat(fd, function(err, stats) {
              if (err) {
                 this.error_cb(err);
              }
              this.current_index = stats.size;
            }.bind(this));
          }
          else {
            this.logger.info("Start reading at " + start_index);
            this.current_index = start_index;
            this.tail();
          }
        }.bind(this));
      }
    }.bind(this));
  }
  if (!this.dir_watcher) {
    this.dir_watcher = fs.watch(path.dirname(this.filename), function(event) {
      if (event == 'rename') {
        process.nextTick(function() {
          this.logger.info("Directory change, try to reopen file is needed");
          this.start(0);
        }.bind(this));
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.tail = function(buffers) {
  if (this.fd) {
    var buffer = new Buffer(this.options.buffer_size);
    fs.read(this.fd, buffer, 0, buffer.length, this.current_index, function(err, read, buffer) {
      this.current_index += read;
      if (! buffers) {
        buffers = [];
      }
      buffers.push(buffer);
      if (read == buffer.length) {
        this.tail(buffers);
      }
      else {
        this.process_data(buffers, read);
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.process_data = function(buffers, last_length) {
  s = buffers.slice(0, buffers.length - 1).map(function(x) {return x.toString('ascii', 0, x.length)}).join("");
  s += buffers[buffers.length - 1].toString('ascii', 0, last_length);
  s.split("\n").forEach(function(x) {
    if (x.length > 0) {
      this.line_cb(x);
    }
  }.bind(this));
}
