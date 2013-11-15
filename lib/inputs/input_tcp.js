var base_input = require('../lib/base_input'),
    net = require('net'),
    tls = require('tls'),
    util = require('util'),
    logger = require('log4node');

function InputTcp() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Tcp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type', 'unserializer', 'appendPeerCert'],
    default_values: {
      'unserializer': 'json_logstash',
      'appendPeerCert': true,
    }
  }
  this.enable_ssl();
}

util.inherits(InputTcp, base_input.BaseInput);

InputTcp.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on tcp', this.host + ':' + this.port);

  this.configure_unserialize(this.unserializer);

  var listener = function(c) {
    c.on('data', function(data) {
      this.unserialize_data(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        var obj = {
          'message': data.toString().trim(),
          'host': c.remoteAddress,
          'tcp_port': this.port,
          'type': this.type,
        };
        if (this.ssl && this.appendPeerCert) {
          var peerCert = c.getPeerCertificate();
          delete peerCert['modulus'];
          delete peerCert['exponent'];
          obj['tls'] = { 'authorized': c.authorized, 'peer_cert': peerCert };
        }
        this.emit('data', obj);
      }.bind(this));
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this);

  if (this.ssl) {
    this.server = tls.createServer(this.merge_ssl_options({}), listener);
    this.server.on('clientError', function(err) {
      this.emit('error', err);
    }.bind(this));
  }
  else {
    this.server = net.createServer(listener);
  }

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
