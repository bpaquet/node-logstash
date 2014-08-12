var base_input = require('../lib/base_input'),
  util = require('util'),
  path = require('path'),
  logger = require('log4node'),
  directory_detector = require('../lib/directory_detector'),
  directory_watcher = require('../lib/directory_watcher'),
  file_filter = require('../lib/file_filter'),
  fs = require('fs'),
  monitor_file = require('../lib/monitor_file'),
  tail = require('../lib/tail_file');

function InputFile() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'File',
    host_field: 'file',
    optional_params: ['type', 'buffer_size', 'buffer_encoding', 'wait_delay_after_renaming', 'start_index', 'use_tail'],
    default_values: {
      'use_tail': false,
    },
    start_hook: this.start,
  });
}

util.inherits(InputFile, base_input.BaseInput);

InputFile.prototype.monitorFile = function(dir, filename, start_index) {
  if (this.monitored_files[filename] || !this.filter.filter(filename)) {
    return;
  }

  var full_filename = filename;
  if (dir !== '.') {
    full_filename = dir + '/' + full_filename;
  }

  logger.info('Start input file', full_filename);

  var monitor = this.use_tail ? tail.tail(full_filename) : monitor_file.monitor(full_filename, {
    buffer_size: this.buffer_size,
    buffer_encoding: this.buffer_encoding,
    wait_delay_after_renaming: this.wait_delay_after_renaming,
  });

  this.monitored_files[filename] = monitor;

  monitor.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  monitor.on('data', function(data) {
    this.unserialize_data(data, function(parsed) {
      this.emit('data', parsed);
    }.bind(this), function(data) {
      this.emit('data', {
        'message': data,
        'path': full_filename,
        'type': this.type,
      });
    }.bind(this));
  }.bind(this));

  monitor.start(function(err) {
    if (err) {
      this.emit('error', err);
    }
  }.bind(this), start_index);

};

InputFile.prototype.start = function(callback) {
  logger.info('Start input on file', this.file);

  if (this.start_index) {
    this.start_index = parseInt(this.start_index, 10);
  }

  this.filter = file_filter.create(path.basename(this.file));

  var parent = path.dirname(this.file);
  this.detector = new directory_detector.DirectoryDetector();

  this.detector.on('exists', function() {
    logger.info('Parent directory exists', parent, 'for reading', this.file);

    fs.readdir(parent, function(err, l) {
      if (err) {
        return this.emit('error', new Error('Error while reading ' + parent + ' : ' + err));
      }
      l.forEach(function(x) {
        this.monitorFile(parent, x, this.start_index);
      }.bind(this));
      try {
        this.dir_watcher = directory_watcher.register(parent, function(event, filename) {
          this.monitorFile(parent, filename, 0);
        }.bind(this));
      }
      catch(err) {
        return this.emit('error', new Error('Error while reading ' + parent + ' : ' + err));
      }
    }.bind(this));

  }.bind(this));

  this.monitored_files = {};

  this.detector.start(parent, callback);
};

InputFile.prototype.closeAllMonitoredFiles = function(callback) {
  var to_be_closed = Object.keys(this.monitored_files);
  if (to_be_closed.length === 0) {
    return callback();
  }
  var f = to_be_closed[0];
  var x = this.monitored_files[f];
  delete this.monitored_files[f];
  x.close(function(err) {
    if (err) {
      return callback(err);
    }
    this.closeAllMonitoredFiles(callback);
  }.bind(this));
};

InputFile.prototype.close = function(callback) {
  logger.info('Closing input file', this.file);

  if (this.detector) {
    this.detector.close();
    delete this.detector;
  }
  if (this.dir_watcher) {
    directory_watcher.unregister(this.dir_watcher);
    delete this.dir_watcher;
  }
  if (this.monitored_files) {
    this.closeAllMonitoredFiles(callback);
  }
  else {
    callback();
  }
};

exports.create = function() {
  return new InputFile();
};
