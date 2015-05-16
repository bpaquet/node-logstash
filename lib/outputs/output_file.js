var base_output = require('../lib/base_output'),
  util = require('util'),
  fs = require('fs'),
  logger = require('log4node'),
  sig_listener = require('../lib/sig_listener').sig_listener,
  error_buffer = require('../lib/error_buffer');

function now() {
  return (new Date()).getTime();
}

function FileWriter(filename, error_buffer_delay, delay_before_close, target) {
  this.filename = filename;
  this.error_buffer = error_buffer.create('output to ' + filename, error_buffer_delay, target);
  this.wait_queue = [];
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
    this.error_buffer.emit('error', err);
  }.bind(this));
  this.close_interval = setInterval(function() {
    if (now() - this.last_write > delay_before_close) {
      delete target.writers[filename];
      this.end(function(err) {
        if (err) {
          this.error_buffer.emit('error', err);
        }
      });
    }
  }.bind(this), delay_before_close);
}

FileWriter.prototype.write = function(b) {
  this.last_write = now();
  if (this.stream) {
    this.stream.write(b);
  }
  else {
    this.wait_queue.push(b);
  }
};

FileWriter.prototype.end = function(callback) {
  delete this.error_buffer;
  clearInterval(this.close_interval);
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
    return 'output to file ' + this.file;
  }));
  this.mergeConfig({
    name: 'file',
    host_field: 'file',
    optional_params: ['delimiter', 'delay_before_close'],
    default_values: {
      delimiter: '\n',
      delay_before_close: 300000,
    },
    start_hook: this.start,
  });
}

util.inherits(OutputFile, base_output.BaseOutput);

OutputFile.prototype.reopen = function(callback) {
  this.closeAll(Object.keys(this.writers), callback);
};

OutputFile.prototype.closeAll = function(files, callback) {
  if (files.length === 0) {
    if (callback) {
      callback();
    }
    return;
  }
  var f = files.shift();
  var w = this.writers[f];
  delete this.writers[f];
  w.end(function(err) {
    if (err) {
      return callback(err);
    }
    this.closeAll(files, callback);
  }.bind(this));
};

OutputFile.prototype.start = function(callback) {
  logger.info('Start output to file ' + this.file);

  this.writers = {};

  this.sig_listener = function() {
    this.reopen();
  }.bind(this);

  sig_listener.on('SIGUSR2', this.sig_listener);

  callback();
};

OutputFile.prototype.getWriter = function(filename) {
  if (!this.writers[filename]) {
    this.writers[filename] = new FileWriter(filename, this.error_buffer_delay, this.delay_before_close, this);
  }
  return this.writers[filename];
};

OutputFile.prototype.process = function(data) {
  var line = this.serialize_data(data);
  if (line) {
    var filename = this.replaceByFields(data, this.file);
    if (filename) {
      var writer = this.getWriter(filename);
      writer.write(line + this.delimiter);
    }
    else {
      this.error_buffer.emit('error', new Error('Unable to compute output filename ' + this.file));
    }
  }
};

OutputFile.prototype.close = function(callback) {
  logger.info('Closing output to file', this.file);
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
