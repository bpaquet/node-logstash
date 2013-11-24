var base_input = require('../lib/base_input'),
    util = require('util'),
    path = require('path'),
    logger = require('log4node'),
    fs = require('fs'),
    monitor_file = require('../lib/monitor_file'),
    tail = require('../lib/tail_file');

function InputDir() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Directory',
    host_field: 'dir',
    optional_params: ['type', 'exclude', 'include', 'buffer_size', 'buffer_encoding', 'wait_delay_after_renaming', 'use_tail'],
    default_values: {
      'use_tail': false,
      'include': '*'
    },
    start_hook: this.start
  });
}

util.inherits(InputDir, base_input.BaseInput);

InputDir.prototype.filterFile = function(filename) {
  var matches = this.include.test(filename);
  if (matches && this.exclude) {
    matches = !this.exclude.test(filename);
  }
  return matches;
}

InputDir.prototype.monitorDirectoryFiles = function(callback) {
  fs.readdir(this.dir, function(error, filenames) {
    if (error) {
      this.emit('error', error);
      if (callback) {
        callback();
      }
      return;
    }

    var i = 0;
    function nextFilename() {
      i++;
      if (i < filenames.length) {
        this.monitorFile(filenames[i], nextFilename.bind(this));
      } else if (callback) {
        callback();
      }
    };

    if (filenames.length > 0) {
      this.monitorFile(filenames[0], nextFilename.bind(this));
    }

  }.bind(this));
}

InputDir.prototype.monitorFile = function(filename, callback) {

  // a file was created/deleted/renamed

  var fullFilename = this.dir+'/'+filename;

  // if we already have a monitor for this file, then it was just created or renamed to this
  // so just close this monitor
  if (this.monitors[filename]) {
    delete this.monitors[filename];
    if (callback) {
      callback();
    }
    return;
  }

  // not currently monitoring this file so set up a monitor.
  // check if this as a file or directory
  fs.stat(fullFilename, function(err, stat) {

    if (err) {
      this.emit('error', err);
    } else if (stat.isFile() && this.filterFile(filename)) {
      // monitor only if this is a file
      // create a new monitor for the file
      if (this.use_tail) {
        var monitor = tail.tail(this.file);
      } else {
        var monitor = monitor_file.monitor(fullFilename, {
          buffer_size: this.buffer_size,
          buffer_encoding: this.buffer_encoding,
          wait_delay_after_renaming: this.wait_delay_after_renaming
        });
      }

      monitor.on('error', function(err) {
        this.emit('error', err);
      }.bind(this));

      monitor.on('data', function(data) {
        this.unserialize_data(data, function(parsed) {
          this.emit('data', parsed);
        }.bind(this), function(data) {
          this.emit('data', {
            'message': data,
            'path': fullFilename,
            'type': this.type
          });
        }.bind(this));
      }.bind(this));

      monitor.start(function(err) {
        if (err) {
          this.emit('error', err);
        }
      }.bind(this));

      this.monitors[filename] = monitor;
    }

    if (callback) {
      callback();
    }

  }.bind(this));
}

InputDir.prototype.createRegExp = function(regexp) {
  return new RegExp(regexp.replace(/([.+^=!:${}()|\[\]\/\\])/g, '\\$1').replace('*','(.*)').replace('?','(.?)'));
}

InputDir.prototype.start = function(callback) {
  logger.info('Start input on directory', this.dir, '(includes', this.include, ', excludes', this.exclude ? this.exclude : 'none', ')');

  this.include = this.createRegExp(this.include);
  this.exclude = this.exclude ? this.createRegExp(this.exclude) : null;

  this.monitors = {};

  this.watcher = fs.watch(this.dir, function(event, filename) {
    if (event == 'rename') {
      this.monitorFile(filename);
    }
  }.bind(this));

  this.watcher.on('error', function(error) {
    this.emit('error', error);
  }.bind(this));

  this.monitorDirectoryFiles(callback);
};

InputDir.prototype.close = function(callback) {
  logger.info('Closing input directory', this.dir);

  if (this.watcher) {
    this.watcher.close();
  }

  if (this.monitors) {
    var keys = Object.keys(this.monitors);
    var count = keys.length;
    if (count == 0) {
      callback();
    } else {
      keys.forEach(function(monitor) {
        this.monitors[monitor].close(function() {
          count--;
          if (count == 0) {
            callback();
          }
        }.bind(this));
      }.bind(this));
    }
  }

};

exports.create = function() {
  return new InputDir();
};
