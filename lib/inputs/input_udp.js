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
    optional_params: ['type', 'source', 'unserializer'],
    default_values: {
      'unserializer': 'json_logstash',
    }
  }
}

util.inherits(InputUdp, base_input.BaseInput);

InputUdp.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on udp', this.host + ':' + this.port);

  this.configure_unserialize(this.unserializer);

  this.server = dgram.createSocket('udp4');

  this.server.on('message', function(data, remote) {
    this.unserialize_data(data, function(parsed) {
      this.emit('data', parsed);
    }.bind(this), function(data) {
      this.emit('data', {
        'message': data.toString().trim(),
        'host': remote.address,
        'udp_port': this.port,
        'type': this.type,
      });
    }.bind(this));
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
