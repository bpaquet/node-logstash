var base_output = require('../lib/base_output'),
    util = require('util'),
    fs = require('fs'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputFile() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'file',
    host_field: 'file',
    optional_params: ['error_buffer_delay'],
    default_values: {
      'error_buffer_delay': 2000,
    }
  }
}

util.inherits(OutputFile, base_output.BaseOutput);

OutputFile.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to file ' + this.file);

  this.error_buffer = error_buffer.create('output OutputFile to ' + this.file, this.error_buffer_delay, this);

  this.stream = fs.createWriteStream(this.file, {flags: 'w'});

  this.stream.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  callback();
}


OutputFile.prototype.process = function(data) {
  this.stream.write(JSON.stringify(data) + '\n');
}

OutputFile.prototype.close = function() {
  logger.info('Cloing output to file', this.file);
  this.stream.end(function(err) {
    if (err) {
      this.emit('error', err);
    }
  }.bind(this));
}

exports.create = function() {
  return new OutputFile();
}
