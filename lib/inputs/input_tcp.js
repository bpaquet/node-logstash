var base_input = require('../lib/base_input'),
    net = require('net'),
    util = require('util'),
    logger = require('log4node');

function InputTcp() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Tcp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type'],
  }
}

util.inherits(InputTcp, base_input.BaseInput);

InputTcp.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on tcp', this.host + ':' + this.port);

  this.server = net.createServer(function(c) {
    c.on('data', function(data) {
      try {
        var parsed = JSON.parse(data);
        this.emit('data', parsed);
      }
      catch(e) {
        this.emit('data', {
          '@message': data.toString().trim(),
          '@source': 'tcp_' + this.host + '_' + this.port,
          '@type': this.type,
        });
      }
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this));

  this.server.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.server.listen(this.port, this.host);

  this.server.once('listening', callback);
}

InputTcp.prototype.close = function(callback) {
  logger.info('Closing listening tcp', this.host + ':' + this.port);
  this.server.close(callback);
}

exports.create = function() {
  return new InputTcp();
}