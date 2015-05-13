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
    optional_params: ['type', 'path'],
    default_values: {
      'path': '/',
    },
    start_hook: this.start,
  });
}

util.inherits(InputWebsocket, base_input.BaseInput);

InputWebsocket.prototype.start = function(callback) {
  logger.info('Start listening on websocket', this.host + ':' + this.port, 'ssl ' + this.ssl);

  if (this.ssl) {
    this.server = https.createServer(ssl_helper.merge_options(this, {}));
    this.server.on('clientError', function(err) {
      this.emit('error', err);
    }.bind(this));
  }
  else {
    this.server = http.createServer();
  }

  this.wss = new WebSocketServer({ server: this.server, path: this.path });
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

  this.server.once('listening', callback);
  this.server.listen(this.port, this.host);
};

InputWebsocket.prototype.close = function(callback) {
  logger.info('Closing websocket server', this.host + ':' + this.port, 'ssl ' + this.ssl);
  // close the server and terminate all clients
  this.wss.close();
  this.server.close(function() {
    callback();
  });
};

exports.create = function() {
  return new InputWebsocket();
};
