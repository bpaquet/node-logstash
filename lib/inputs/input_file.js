var base_input = require('../lib/base_input'),
  util = require('util'),
  path = require('path'),
  logger = require('log4node'),
  directory_detector = require('../lib/directory_detector'),
  directory_watcher = require('../lib/directory_watcher'),
  file_filter = require('../lib/file_filter'),
  fs = require('fs'),
  monitor_file = require('../lib/monitor_file'),
  tail = require('../lib/tail_file'),
  async = require('async');

function InputFile() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'File',
    host_field: 'path',
    optional_params: ['type', 'buffer_size', 'buffer_encoding', 'wait_delay_after_renaming', 'start_index', 'use_tail'],
    default_values: {
      'use_tail': false,
    },
    start_hook: this.start,
  });
}

util.inherits(InputFile, base_input.BaseInput);

InputFile.prototype.monitorFile = function(dir, local_filename, start_index) {
  var filename = (dir === '.' ? path.resolve('.') : dir) + '/' + local_filename;
  if (this.monitored_files[filename] || !this.filter.filter(local_filename)) {
    return;
  }

  logger.info('Start input file', filename);

  var monitor = this.use_tail ? tail.tail(filename) : monitor_file.monitor(filename, {
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
        'path': filename,
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
  logger.info('Start input on file', this.path);

  if (this.start_index) {
    this.start_index = parseInt(this.start_index, 10);
  }

  this.filter = file_filter.create(path.basename(this.path));

  var detector = new directory_detector.DirectoryDetector();

  detector.on('removed', function(dir) {
    if (this.monitored_files[dir]) {
      this.monitored_files[dir].close(function() {});
      delete this.monitored_files[dir];
    }
    Object.keys(this.monitored_files).forEach(function(k) {
      if (k.indexOf(dir) === 0) {
        this.monitored_files[k].close(function() {});
        delete this.monitored_files[k];
      }
    }.bind(this));
  }.bind(this));

  detector.on('exists', function(dir, newly_created) {
    logger.info('Parent directory exists', dir, 'for reading', this.path);

    fs.readdir(dir, function(err, l) {
      if (err) {
        return this.emit('error', new Error('Error while reading ' + dir + ' : ' + err));
      }
      l.forEach(function(x) {
        this.monitorFile(dir, x, newly_created ? 0 : this.start_index);
      }.bind(this));
      try {
        var dir_watcher = directory_watcher.register(dir, function(event, filename) {
          this.monitorFile(dir, filename, 0);
        }.bind(this));
        this.monitored_files[dir] = {
          close: function(callback) {
            directory_watcher.unregister(dir_watcher);
            callback();
          }
        };
      }
      catch(err) {
        return this.emit('error', new Error('Error while reading ' + dir + ' : ' + err));
      }
    }.bind(this));

  }.bind(this));

  this.monitored_files = {};
  this.monitored_files.__detector__ = detector;

  detector.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));
  detector.start(path.dirname(this.path), callback);
};

InputFile.prototype.close = function(callback) {
  logger.info('Closing input file', this.path);
  async.eachSeries(Object.keys(this.monitored_files), function(x, callback) {
    var o = this.monitored_files[x];
    delete this.monitored_files[x];
    o.close(callback);
  }.bind(this), callback);
};

exports.create = function() {
  return new InputFile();
};
