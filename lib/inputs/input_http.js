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
    optional_params: ['type', 'unserializer', 'ssl', 'cert_private', 'cert_public'],
    default_values: {
      'unserializer': 'json_logstash',
      'ssl': false,
      'cert_private': '/etc/ssl/private.pem',
      'cert_public': '/etc/ssl/public.pem'
    }
  }
}

util.inherits(InputHttp, base_input.BaseInput);

InputHttp.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on ' + this.proto, this.host + ':' + this.port);

  this.configure_unserialize(this.unserializer);

  this.serverCallback = function(request, response) {
    var data = "";

    request.on('data', function(chunk) {
      data += chunk.toString();
    });

    request.on('end', function() {
      this.unserialize_data(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        this.emit('data', {
          'message': data.trim(),
          'host': response.remoteAddress,
          'http_port': this.port,
          'type': this.type,
        });
      }.bind(this));
      response.writeHead(201);
      response.end();
    }.bind(this));

    request.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this);

  if (this.ssl) {
    var options = {
      key: fs.readFileSync(this.cert_private),
      cert: fs.readFileSync(this.cert_public)
    };
    this.server = https.createServer(options, this.serverCallback);
  }
  else {
    this.server = http.createServer(this.serverCallback);
  }

  this.server.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.server.listen(this.port, this.host);

  this.server.once('listening', callback);
}

InputHttp.prototype.close = function(callback) {
  logger.info('Closing http server', this.host + ':' + this.port);
  this.server.close(callback);
}

exports.create = function() {
  return new InputHttp();
}
