var base_output = require('../lib/base_output'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputUnix() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'UnixSocket',
    host_field: 'file',
    optional_params: ['error_buffer_delay'],
    default_values: {
      'error_buffer_delay': 2000,
    }
  }
}

util.inherits(OutputUnix, base_output.BaseOutput);

OutputUnix.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output on unix socket', this.file);
  this.error_buffer = error_buffer.create('output unix to ' + this.file, this.error_buffer_delay, this);
  callback();
}

OutputUnix.prototype.process = function(data) {
  var c = net.createConnection({path: this.file}, function() {
    c.write(JSON.stringify(data));
    c.end();
  });
  c.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
}

OutputUnix.prototype.close = function(callback) {
  logger.info('Closing output to unix socket output', this.file);
  callback();
}

exports.create = function() {
  return new OutputUnix();
}
