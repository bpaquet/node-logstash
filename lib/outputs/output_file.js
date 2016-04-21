var base_output = require('../lib/base_output'),
  util = require('util'),
  fs = require('fs'),
  logger = require('log4node'),
  async = require('async'),
  mkdirp = require('mkdirp'),
  path = require('path'),
  sig_listener = require('../lib/sig_listener').sig_listener,
  error_buffer = require('../lib/error_buffer');

var mkdir_queue = async.queue(mkdirp, 1);
var cache_path = {};

function now() {
  return (new Date()).getTime();
}

function createPath(path, callback) {
  if (cache_path[path]) {
    return callback();
  }
  mkdir_queue.push(path, function(err) {
    if (!err) {
      cache_path[path] = 1;
    }
    callback(err);
  });
}

function FileWriter(logger, filename, retry_delay, idle_timeout, event_target, delete_callback) {
  this.on_error = false;
  this.wait_queue = [];
  var suicide = function() {
    logger.info('Early closing of', filename);
    delete_callback();
    this.end(function(err) {
      if (err) {
        event_target.emit('error', err);
      }
    });
  }.bind(this);
  createPath(path.dirname(filename), function(err) {
    if (err) {
      this.on_error = true;
      event_target.emit('error', err);
      return;
    }
    var stream = fs.createWriteStream(filename, {
      flags: 'a'
    });
    stream.on('open', function() {
      this.wait_queue.forEach(function(b) {
        stream.write(b);
      });
      delete this.wait_queue;
      this.stream = stream;
    }.bind(this));
    stream.on('error', function(err) {
      this.on_error = true;
      event_target.emit('error', err);
      if (!this.suicide_timeout) {
        this.suicide_timeout = setTimeout(function() {
          delete this.suicide_timeout;
          suicide();
        }, retry_delay * 1000);
      }
    }.bind(this));
    if (idle_timeout > 0) {
      this.idle_check_interval = setInterval(function() {
        if (this.last_write !== undefined && (now() - this.last_write) > idle_timeout) {
          logger.info('Closing file without activity', filename);
          suicide();
        }
      }.bind(this), idle_timeout * 1000);
    }
  }.bind(this));
}

FileWriter.prototype.write = function(b) {
  if (this.on_error) {
    return;
  }
  this.last_write = now();
  if (this.stream) {
    this.stream.write(b);
  }
  else {
    this.wait_queue.push(b);
  }
};

FileWriter.prototype.end = function(callback) {
  if (this.suicide_timeout) {
    clearTimeout(this.suicide_timeout);
  }
  if (this.idle_check_interval) {
    clearInterval(this.idle_check_interval);
  }
  if (this.stream) {
    this.stream.end(callback);
  }
  else {
    callback();
  }
};

function OutputFile() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(this.serializer_config('raw'));
  this.mergeConfig(error_buffer.config(function() {
    return 'output to file ' + this.path;
  }));
  this.mergeConfig({
    name: 'file',
    host_field: 'path',
    optional_params: ['delimiter', 'idle_timeout', 'retry_delay'],
    default_values: {
      delimiter: '\n',
      idle_timeout: 300,
      retry_delay: 300,
    },
    start_hook: this.start,
  });
}

util.inherits(OutputFile, base_output.BaseOutput);

OutputFile.prototype.reopen = function(callback) {
  this.closeAll(Object.keys(this.writers), callback);
};

OutputFile.prototype.closeAll = function(files, callback) {
  async.eachSeries(files, function(f, callback) {
    var w = this.writers[f];
    delete this.writers[f];
    w.end(callback);
  }.bind(this), callback);
};

OutputFile.prototype.start = function(callback) {
  logger.info('Start output to file ' + this.path);

  this.writers = {};

  this.sig_listener = function() {
    this.reopen();
  }.bind(this);

  sig_listener.on('SIGUSR2', this.sig_listener);

  callback();
};

OutputFile.prototype.getWriter = function(filename) {
  if (!this.writers[filename]) {
    this.writers[filename] = new FileWriter(logger, filename, this.retry_delay, this.idle_timeout, this, function() {
      delete this.writers[filename];
    }.bind(this));
  }
  return this.writers[filename];
};

OutputFile.prototype.process = function(data) {
  var line = this.serialize_data(data);
  if (line) {
    var filename = this.replaceByFields(data, this.path);
    if (filename) {
      var writer = this.getWriter(filename);
      writer.write(line + this.delimiter);
    }
    else {
      this.error_buffer.emit('error', new Error('Unable to compute output filename ' + this.path));
    }
  }
};

OutputFile.prototype.close = function(callback) {
  logger.info('Closing output to file', this.path);
  if (this.sig_listener) {
    sig_listener.removeListener('SIGUSR2', this.sig_listener);
  }
  this.closeAll(Object.keys(this.writers), function(err) {
    if (err) {
      this.emit('error', err);
    }
    callback();
  }.bind(this));
};

exports.create = function() {
  return new OutputFile();
};
