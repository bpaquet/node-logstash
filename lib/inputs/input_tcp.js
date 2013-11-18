var base_input = require('../lib/base_input'),
    net = require('net'),
    tls = require('tls'),
    util = require('util'),
    ssl_helper = require('../lib/ssl_helper'),
    logger = require('log4node');

function InputTcp() {
  base_input.BaseInput.call(this);
  this.merge_config(ssl_helper.config());
  this.merge_config(this.unserializer_config());
  this.merge_config({
    name: 'Tcp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type', 'appendPeerCert'],
    default_values: {
      'appendPeerCert': true,
    },
    startHook: this.start,
  });
}

util.inherits(InputTcp, base_input.BaseInput);

InputTcp.prototype.start = function(callback) {
  logger.info('Start listening on tcp', this.host + ':' + this.port);

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
          delete peerCert.modulus;
          delete peerCert.exponent;
          obj.tls = { 'authorized': c.authorized, 'peer_cert': peerCert };
        }
        this.emit('data', obj);
      }.bind(this));
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this);

  if (this.ssl) {
    this.server = tls.createServer(ssl_helper.merge_options(this, {}), listener);
    this.server.on('clientError', function(err) {
      this.emit('error', err);
    }.bind(this));
  }
  else {
    this.server = net.createServer(listener);
  }

  this.server.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.server.listen(this.port, this.host);

  this.server.once('listening', callback);
};

InputTcp.prototype.close = function(callback) {
  logger.info('Closing listening tcp', this.host + ':' + this.port);
  this.server.close(callback);
};

exports.create = function() {
  return new InputTcp();
};
