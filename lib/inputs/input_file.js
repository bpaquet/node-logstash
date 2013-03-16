var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    monitor_file = require('../lib/monitor_file'),
    tail = require('../lib/tail_file');

function InputFile() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'File',
    host_field: 'file',
    optional_params: ['type', 'buffer_size', 'buffer_encoding', 'wait_delay_after_renaming', 'start_index', 'use_tail'],
    default_values: {
      use_tail: false,
    }
  }
}

util.inherits(InputFile, base_input.BaseInput);

InputFile.prototype.afterLoadConfig = function(callback) {
  logger.info('Start input on file', this.file);

  if (this.start_index) {
    this.start_index = parseInt(this.start_index);
  }

  if (this.use_tail) {
    this.monitor = tail.tail(this.file);
  }
  else {
    this.monitor = monitor_file.monitor(this.file, {
      buffer_size: this.buffer_size,
      buffer_encoding: this.buffer_encoding,
      wait_delay_after_renaming: this.wait_delay_after_renaming,
    });
  }

  this.monitor.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.monitor.on('init_error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.monitor.on('data', function(data) {
    try {
      var parsed = JSON.parse(data);
      if (!parsed['@message']) {
        throw new Error();
      }
      this.emit('data', parsed);
    }
    catch(e) {
      this.emit('data', {
        '@message': data,
        '@source': this.file,
        '@type': this.type,
      });
    }
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