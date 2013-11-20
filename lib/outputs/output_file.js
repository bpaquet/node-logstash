var base_output = require('../lib/base_output'),
    util = require('util'),
    fs = require('fs'),
    logger = require('log4node'),
    sig_listener = require('../lib/sig_listener').sig_listener,
    error_buffer = require('../lib/error_buffer');

function OutputFile() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(this.serializer_config('raw'));
  this.mergeConfig(error_buffer.config(function() {
    return 'output to file ' + this.file;
  }));
  this.mergeConfig({
    name: 'file',
    host_field: 'file',
    start_hook: this.start,
  });
}

util.inherits(OutputFile, base_output.BaseOutput);

OutputFile.prototype.reopen = function(callback) {
  if (this.stream) {
    this.stream.end();
  }
  this.stream = fs.createWriteStream(this.file, {flags: 'a'});

  this.stream.on('open', function() {
    if (callback) {
      callback();
    }
    this.error_buffer.emit('ok');
  }.bind(this));

  this.stream.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
};

OutputFile.prototype.start = function(callback) {
  logger.info('Start output to file ' + this.file);

  this.reopen(callback);

  this.sig_listener = function() {
    this.reopen();
  }.bind(this);

  sig_listener.on('SIGUSR2', this.sig_listener);
};

OutputFile.prototype.process = function(data) {
  var line = this.serialize_data(data);
  if (line) {
    this.stream.write(line + '\n');
  }
};

OutputFile.prototype.close = function(callback) {
  logger.info('Closing output to file', this.file);
  if (this.sig_listener) {
    sig_listener.removeListener('SIGUSR2', this.sig_listener);
  }
  this.stream.end(function(err) {
    if (err) {
      this.emit('error', err);
    }
    callback();
  }.bind(this));
};

exports.create = function() {
  return new OutputFile();
};
