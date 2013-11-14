var base_input = require('../lib/base_input'),
    http = require('http'),
    https = require('https'),
    util = require('util'),
    fs = require('fs'),
    logger = require('log4node');

function InputHttp() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Http',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type', 'unserializer', 'proto', 'private', 'public'],
    default_values: {
      'unserializer': 'json_logstash',
      'proto': 'http',
      'private': '/etc/ssl/private.pem',
      'public': '/etc/ssl/public.pem'
    }
  }
}

util.inherits(InputHttp, base_input.BaseInput);

InputHttp.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on ' + this.proto, this.host + ':' + this.port);

  this.configure_unserialize(this.unserializer);
  
  this.serverCallback = function(request, response) {
    request.on('data', function(data) {
      this.unserialize_data(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        this.emit('data', {
          'message': data.toString().trim(),
          'host': c.remoteAddress,
          'tcp_port': this.port,
          'type': this.type,
        });
      }.bind(this));
    }.bind(this));
    request.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this);
  
  if (this.proto == 'https') {
    var options = {
      key: fs.readFileSync(this.private),
      cert: fs.readFileSync(this.public)
    };
    this.server = https.createServer(options, this.serverCallback);
  } else {
    this.server = http.createServer(this.serverCallback);
  }

  this.server.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.server.listen(this.port, this.host);

  this.server.once('listening', callback);
}

InputHttp.prototype.close = function(callback) {
  logger.info('Closing listening ' + this.proto, this.host + ':' + this.port);
  this.server.close(callback);
}

exports.create = function() {
  return new InputHttp();
}
