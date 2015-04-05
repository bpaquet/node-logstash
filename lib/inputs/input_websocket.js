var base_input = require('../lib/base_input'),
  util = require('util'),
  http = require('http'),
  https = require('https'),
  WebSocketServer = require('ws').Server,
  ssl_helper = require('../lib/ssl_helper'),
  logger = require('log4node');

function InputWebsocket() {
  base_input.BaseInput.call(this);
  this.mergeConfig(ssl_helper.config());
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Websocket',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type'],
    start_hook: this.start,
  });
}

util.inherits(InputWebsocket, base_input.BaseInput);

InputWebsocket.prototype.start = function(callback) {
  logger.info('Start listening on websocket', this.host + ':' + this.port, 'ssl ' + this.ssl);

  var server;
  if (this.ssl) {
    server = https.createServer(ssl_helper.merge_options(this, {}));
    server.on('clientError', function(err) {
      this.emit('error', err);
    }.bind(this));
  }
  else {
    server = http.createServer();
  }

  this.wss = new WebSocketServer({ server: server });
  this.wss.on('connection', function(ws) {

    ws.on('message', function(data) {
      this.unserialize_data(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        this.emit('data', {
          'message': data.trim(),
          'host': ws._socket.remoteAddress,
          'ws_port': this.port,
          'type': this.type,
        });
      }.bind(this));
    }.bind(this));

    ws.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));

  }.bind(this));

  this.wss.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  server.once('listening', callback);
  server.listen(this.port, this.host);
};

InputWebsocket.prototype.close = function(callback) {
  logger.info('Closing websocket server', this.host + ':' + this.port, 'ssl ' + this.ssl);
  // close the server and terminate all clients
  this.wss.close();
  callback();
};

exports.create = function() {
  return new InputWebsocket();
};