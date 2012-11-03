var base_input = require('../lib/base_input'),
    dgram = require('dgram'),
    util = require('util'),
    logger = require('log4node');

function InputUdp() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Udp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type', 'format'],
  }
}

util.inherits(InputUdp, base_input.BaseInput);

InputUdp.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on udp', this.host + ':' + this.port);

  this.server = dgram.createSocket('udp4');

  this.server.on('message', function(data) {
    this.emit('data', this.toEvent(data.toString().trim(), 'udp://' + this.host + ':' + this.port));
  }.bind(this));

  this.server.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.server.once('listening', callback);

  this.server.bind(this.port, this.host);
}

InputUdp.prototype.close = function(callback) {
  logger.info('Closing listening udp', this.host + ':' + this.port);
  this.server.close();
  callback();
}

exports.create = function() {
  return new InputUdp();
}