var base_output = require('../lib/base_output'),
    util = require('util'),
    fs = require('fs'),
    events = require('events'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

var sig_listener = new events.EventEmitter();
sig_listener.setMaxListeners(0);

process.on('SIGUSR2', function() {
  sig_listener.emit('SIGUSR2');
});

function OutputFile() {
  base_output.BaseOutput.call(this);
  this.merge_config({
    name: 'file',
    host_field: 'file',
  });
  this.merge_config(this.serializer_config('raw'));
  this.merge_config(error_buffer.config(function() {
    return 'output to file ' + this.file;
  }));
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

OutputFile.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to file ' + this.file);

  this.reopen(callback);

  sig_listener.on('SIGUSR2', function() {
    this.reopen();
  }.bind(this));
};

OutputFile.prototype.process = function(data) {
  var line = this.serialize_data(data);
  if (line) {
    this.stream.write(line + '\n');
  }
};

OutputFile.prototype.close = function(callback) {
  logger.info('Closing output to file', this.file);
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
