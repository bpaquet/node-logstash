var base_input = require('../lib/base_input'),
  net = require('net'),
  tls = require('tls'),
  util = require('util'),
  ssl_helper = require('../lib/ssl_helper'),
  logger = require('log4node');

function InputTcp() {
  base_input.BaseInput.call(this);
  this.mergeConfig(ssl_helper.config());
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Tcp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type', 'appendPeerCert'],
    default_values: {
      'appendPeerCert': true,
    },
    start_hook: this.start,
  });
}

util.inherits(InputTcp, base_input.BaseInput);

InputTcp.prototype.start = function(callback) {
  logger.info('Start listening on tcp', this.host + ':' + this.port);
  this.counter = 0;
  this.current = {};

  var listener = function(c) {
    var local_id = this.counter;
    this.counter += 1;
    this.current[local_id] = c;
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
          obj.tls = {
            'authorized': c.authorized,
            'peer_cert': peerCert
          };
        }
        this.emit('data', obj);
      }.bind(this));
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
    c.on('close', function() {
      delete this.current[local_id];
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

InputTcp.prototype.closeAll = function(callback) {
  var cs = Object.keys(this.current);
  if (cs.length === 0) {
    return callback();
  }
  var c = this.current[cs[0]];
  c.once('close', function() {
    delete this.current[cs[0]];
    this.closeAll(callback);
  }.bind(this));
  c.end();
};

InputTcp.prototype.close = function(callback) {
  logger.info('Closing listening tcp', this.host + ':' + this.port);
  this.closeAll(function() {
    this.server.close(callback);
  }.bind(this));
};

exports.create = function() {
  return new InputTcp();
};
