var fs = require('fs'),
path = require('path');

module.exports = {
  monitor: function(filename, line_cb, error_cb, start_index) {
    return new MonitoredFile(filename, line_cb, error_cb, start_index)
  }
}

function MonitoredFile(filename, line_cb, error_cb, start_index) {
  this.filename = path.resolve(filename);
  this.line_cb = line_cb;
  this.error_cb = function(err) {
    if (error_cb) {
      error_cb(err);
    }
  };
  this.open(start_index);
}

MonitoredFile.prototype.close = function() {
  if (this.fd) {
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

MonitoredFile.prototype.open = function(start_index) {
  if (!this.fd) {
    fs.exists(this.filename, function(exists) {
      if (exists) {
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
              this.close();
            }
            else {
              this.error_cb("Unknown event : " + event);
            }
          }.bind(this));
          if (start_index !== undefined) {
            this.current_index == start_index;
            this.tail();
          }
          else {
            fs.fstat(fd, function(err, stats) {
              if (err) {
                 this.error_cb(err);
              }
              this.current_index = stats.size;
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
  if (!this.dir_watcher) {
    this.dir_watcher = fs.watch(path.dirname(this.filename), function(event) {
      if (event == 'rename') {
        process.nextTick(function() {
          this.open(0);
        }.bind(this));
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.tail = function(array) {
  if (this.fd) {
    var buffer = new Buffer(256);
    fs.read(this.fd, buffer, 0, buffer.length, this.current_index, function(err, read, buffer) {
      this.current_index += read;
      if (! array) {
        array = [];
      }
      array = array.concat([buffer]);
      if (read == buffer.length) {
        this.tail(array);
      }
      else {
        this.process_data(array, read);
      }
    }.bind(this));
  }
}

MonitoredFile.prototype.process_data = function(arrays, last_length) {
  s = arrays.slice(0, arrays.length - 1).map(function(x) {return x.toString('ascii', 0, x.length)}).join();
  s += arrays[arrays.length - 1].toString('ascii', 0, last_length);
  s.split("\n").forEach(function(x) {
    if (x.length > 0) {
      this.line_cb(x);
    }
  }.bind(this));
}
