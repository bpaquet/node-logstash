var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    monitor_file = require('../lib/monitor_file'),
    os = require('os');

function InputFile() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'File',
    host_field: 'file',
    optional_params: ['type', 'buffer_size', 'buffer_encoding', 'wait_delay_after_renaming', 'start_index', 'format', 'tags'],
    default_values: {
      'format': 'plain',
    }
  }
  this.host = os.hostname();
}

util.inherits(InputFile, base_input.BaseInput);

InputFile.prototype.afterLoadConfig = function(callback) {
  logger.info('Start input on file', this.file);

  this.monitor = monitor_file.monitor(this.file, {
    buffer_size: this.buffer_size,
    buffer_encoding: this.buffer_encoding,
    wait_delay_after_renaming: this.wait_delay_after_renaming,
  });

  this.monitor.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.monitor.on('init_error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.monitor.on('data', function(data) {
    this.emit('data', this.toEvent(data.toString().trim(), 'file://'+this.host+this.file));
  }.bind(this));

  this.monitor.start(this.start_index);

  callback();
}

InputFile.prototype.close = function(callback) {
  logger.info('Closing listening file', this.file);
  this.monitor.close(callback);
}

exports.create = function() {
  return new InputFile();
}