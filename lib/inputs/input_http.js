var base_input = require('../lib/base_input'),
  http = require('http'),
  https = require('https'),
  util = require('util'),
  ssl_helper = require('../lib/ssl_helper'),
  logger = require('log4node');

function InputHttp() {
  base_input.BaseInput.call(this);
  this.mergeConfig(ssl_helper.config());
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Http',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type'],
    start_hook: this.start,
  });
}

util.inherits(InputHttp, base_input.BaseInput);

InputHttp.prototype.start = function(callback) {
  logger.info('Start listening on', this.host + ':' + this.port, 'ssl ' + this.ssl);

  this.serverCallback = function(request, response) {
    var data = '';

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
    this.server = https.createServer(ssl_helper.merge_options(this, {}), this.serverCallback);
    this.server.on('clientError', function(err) {
      this.emit('error', err);
    }.bind(this));
  }
  else {
    this.server = http.createServer(this.serverCallback);
  }

  this.server.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.server.listen(this.port, this.host);

  this.server.once('listening', callback);
};

InputHttp.prototype.close = function(callback) {
  logger.info('Closing http server', this.host + ':' + this.port, 'ssl ' + this.ssl);
  this.server.close(callback);
};

exports.create = function() {
  return new InputHttp();
};
