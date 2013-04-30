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
    optional_params: ['type', 'source', 'format'],
  }
}

util.inherits(InputUdp, base_input.BaseInput);

InputUdp.prototype.afterLoadConfig = function(callback) {
  if(this.format &&
     this.format != 'plain' &&
     this.format != 'json' &&
     this.format != 'json_event' &&
     this.format != 'json_syslog') {
    return this.emit('init_error', 'Wrong format value: ' + this.format);
  }

  logger.info('Start listening on udp', this.host + ':' + this.port);

  this.server = dgram.createSocket('udp4');

  this.server.on('message', function(data, remote) {
    var parsed = {
      '@message': data.toString().trim(),
      '@source': this.source || 'udp_' + this.host + '_' + this.port,
      '@source_host': remote.address,
      '@type': this.type,
    };

    try {
      switch(this.format) {
        case 'json': // JSON payload, parsed as fields
          parsed['@fields'] = JSON.parse(data);
          break;
        case 'json_syslog': // RFC 3164 compatible message with JSON payload, parsed as fields
          data = data.toString();
          parsed['@fields'] = JSON.parse(data.substring(data.indexOf('{', 0)));
          break;
        case 'plain': // Plain text, no parsing
          break;
        case 'json_event': // JSON message, or fallback to text (legacy behaviour)
        default:
          parsed = JSON.parse(data);
          break;
      }
    }
    catch(e) {
    }

    this.emit('data', parsed);
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