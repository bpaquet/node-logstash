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
  this.config = {
    name: 'file',
    host_field: 'file',
    optional_params: ['error_buffer_delay', 'serializer', 'format'],
    default_values: {
      'serializer': 'raw',
      'format': '#{message}',
      'error_buffer_delay': 2000,
    }
  }
}

util.inherits(OutputFile, base_output.BaseOutput);

OutputFile.prototype.reopen = function() {
  if (this.stream) {
    this.stream.end();
  }
  this.stream = fs.createWriteStream(this.file, {flags: 'a'});

  this.stream.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
}

OutputFile.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to file ' + this.file);

  this.configure_serialize(this.serializer, this.format);

  this.error_buffer = error_buffer.create('output OutputFile to ' + this.file, this.error_buffer_delay, this);

  this.reopen();

  sig_listener.on('SIGUSR2', function() {
    this.reopen();
  }.bind(this));

  callback();
}

OutputFile.prototype.process = function(data) {
  var line = this.serialize_data(data);
  if (line) {
    this.stream.write(line + '\n');
  }
}

OutputFile.prototype.close = function(callback) {
  logger.info('Closing output to file', this.file);
  this.stream.end(function(err) {
    if (err) {
      this.emit('error', err);
    }
    callback();
  }.bind(this));
}

exports.create = function() {
  return new OutputFile();
}
