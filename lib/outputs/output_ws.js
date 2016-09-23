var abstract_http = require('./abstract_http'),
  util = require('util'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer'),
  WebSocket = require('ws');

function OutputWebsocket() {
  abstract_http.AbstractHttp.call(this);
  this.mergeConfig(this.serializer_config('raw'));
  this.mergeConfig(error_buffer.config(function() {
    return 'output websocket to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig({
    name: 'Websocket',
    optional_params: ['path'],
    default_values: {
      'path': '/',
    },
  });
}

util.inherits(OutputWebsocket, abstract_http.AbstractHttp);

OutputWebsocket.prototype.process = function(data) {
  var line = this.serialize_data(data);
  if (this.open) {
    this.send(line);
  } else {
    this.pending.push(line);
  }
};

OutputWebsocket.prototype.send = function(line) {
  this.ws.send(line, function ack(err) {
    if (err) {
      this.error_buffer.emit('error', err);
    }
  }.bind(this));
};

OutputWebsocket.prototype.startAbstract = function(callback) {
  logger.info('Start websocket output to',this.host + ':' + this.port);

  if (this.proxy) {
    this.setupProxy();
  }

  this.pending = [];
  this.connect();
  callback();
};

OutputWebsocket.prototype.connect = function() {
  var protocol = this.ssl ? 'wss' : 'ws';
  var ws_options = {};

  if (this.proxying_agent) {
    ws_options.agent = this.proxying_agent;
  }
  var ws = new WebSocket(protocol + '://' + this.host + ':' + this.port + this.path, ws_options);

  ws.on('open', function() {
    this.open = true;
    this.error_buffer.emit('ok');
    if (this.pending.length > 0) {
      this.pending.forEach(function(line) {
        this.send(line);
      }.bind(this));
      this.pending = [];
    }
  }.bind(this));

  ws.on('close', function() {
    this.open = false;
    if (!this.closed) {
      this.error_buffer.emit('error', 'websocket closed');
      this.connect();
    }
  }.bind(this));

  ws.on('error', function(err) {
    this.open = false;
    if (!this.closed) {
      this.error_buffer.emit('error', err);
      this.connect();
    }
  }.bind(this));

  this.ws = ws;
};

OutputWebsocket.prototype.close = function(callback) {
  logger.info('Closing websocket output to', this.host, this.port, 'ssl ' + this.ssl);
  this.closed = true;
  this.ws.close();
  callback();
};

exports.create = function() {
  return new OutputWebsocket();
};

