var base_input = require('../lib/base_input'),
    tls = require('tls'),
    fs = require('fs'),
    util = require('util'),
    logger = require('log4node');

function InputTls() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Tls',
    host_field: 'host',
    port_field: 'port',
    required_params: ['key', 'cert'],
    optional_params: ['type', 'unserializer', 'ca', 'requestCert', 'rejectUnauthorized', 'appendPeerCert'],
    default_values: {
      'type': null,
      'unserializer': 'json_logstash',
      'ca': null,
      'requestCert': 'true',
      'rejectUnauthorized': 'true',
      'appendPeerCert': 'true'
    }
  }
}

util.inherits(InputTls, base_input.BaseInput);

InputTls.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on tls', this.host + ':' + this.port);

  var tls_options = { host: this.host,
                      port: this.port,
                      key: fs.readFileSync(this.key),
                      cert: fs.readFileSync(this.cert),
                      ca: this.ca ? fs.readFileSync(this.ca) : null,
                      requestCert: this.requestCert.toLowerCase() == 'false' ? false : true,
                      rejectUnauthorized: this.rejectUnauthorized.toLowerCase() == 'false' ? false : true,
                      appendPeerCert: this.appendPeerCert.toLowerCase() == 'false' ? false : true
  }

  this.configure_unserialize(this.unserializer);

  this.server = tls.createServer(tls_options, function(c) {
    c.on('data', function(data) {
      this.unserialize_data(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        var peerCert = {};

        if (tls_options['appendPeerCert']) {
          peerCert = c.getPeerCertificate();
          delete peerCert['modulus'] && delete peerCert['exponent']
        }

        var tls_info = { 'authorized': c.authorized,
                         'peer_cert': peerCert
        }

        this.emit('data', {
          '@message': data.toString().trim(),
          '@source': 'tls_' + this.host + '_' + this.port,
          '@tls': tls_info,
          '@type': this.type,
        });
      }.bind(this));
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

InputTls.prototype.close = function(callback) {
  logger.info('Closing listening tls', this.host + ':' + this.port);
  this.server.close(callback);
}

exports.create = function() {
  return new InputTls();
}
