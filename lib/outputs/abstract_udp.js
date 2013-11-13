var base_output = require('../lib/base_output'),
    util = require('util'),
    dgram = require('dgram'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function AbstractUdp() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'AbstractUdp',
    host_field: 'host',
    port_field: 'port',
    required_params: [],
    optional_params: ['error_buffer_delay'],
    default_values: {
      'error_buffer_delay': 2000,
    }
  }
}

util.inherits(AbstractUdp, base_output.BaseOutput);

AbstractUdp.prototype.abstractAfterLoadConfig = function(callback) {
  logger.info('Start output to ' + this.to());

  this.socket = dgram.createSocket('udp4');

  this.error_buffer = error_buffer.create('output to ' + this.host + ':' + this.port, this.error_buffer_delay, this);

  callback();
}

AbstractUdp.prototype.process = function(data) {
  this.format_payload(data, function(message) {
    this.socket.send(message, 0, message.length, this.port, this.host, function(err, bytes) {
      if (err || bytes != message.length) {
        this.error_buffer.emit('error', new Error('Error while send data to ' + this.host + ':' + this.port + ':' + err));
      }
      else {
        this.error_buffer.emit('ok');
      }
    }.bind(this));
  }.bind(this));
}

AbstractUdp.prototype.close = function(callback) {
  logger.info('Closing output to ' + this.to());
  this.socket.close();
  callback();
}

exports.AbstractUdp = AbstractUdp;