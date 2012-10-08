var base_output = require('../lib/base_output'),
    util = require('util'),
    dgram = require('dgram'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputUdp() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Udp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['error_buffer_delay'],
    default_values: {
      'error_buffer_delay': 2000,
    }
  }
}

util.inherits(OutputUdp, base_output.BaseOutput);

OutputUdp.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to udp', this.host + ':' + this.port);

  this.socket = dgram.createSocket('udp4');

  this.error_buffer = error_buffer.create('output udp to ' + this.host + ':' + this.port, this.error_buffer_delay, this);

  callback();
}

OutputUdp.prototype.process = function(data) {
  var message = new Buffer(JSON.stringify(data));
  this.socket.send(message, 0, message.length, this.port, this.host, function(err, bytes) {
    if (err || bytes != message.length) {
      this.error_buffer.emit('error', new Error('Error while send data to ' + this.host + ':' + this.port + ':' + err));
    }
  }.bind(this));
}

OutputUdp.prototype.close = function(callback) {
  logger.info('Closing output to udp', this.host + ':' + this.port);
  this.socket.close();
  callback();
}

exports.create = function() {
  return new OutputUdp();
}
