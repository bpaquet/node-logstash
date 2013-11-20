var base_output = require('../lib/base_output'),
    util = require('util'),
    net = require('net'),
    tls = require('tls'),
    logger = require('log4node'),
    ssl_helper = require('../lib/ssl_helper'),
    error_buffer = require('../lib/error_buffer');

function AbstractTcp() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(ssl_helper.config());
  this.mergeConfig(error_buffer.config(function() {
    return 'output tcp to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig({
    name: 'AbstractTcp',
    host_field: 'host',
    port_field: 'port',
    start_hook: this.startAbstract,
  });
}

util.inherits(AbstractTcp, base_output.BaseOutput);

AbstractTcp.prototype.startAbstract = function(callback) {
  logger.info('Start output to' + this.to());

  this.closed_callback = function() {};

  callback();
};

AbstractTcp.prototype.findConnection = function(callback) {
  if (this.connection) {
    return callback(this.connection);
  }
  var listener = function() {
    this.error_buffer.emit('ok');
    callback(this.connection);
  }.bind(this);

  if (this.ssl) {
    this.connection = tls.connect(ssl_helper.merge_options(this, {host: this.host, port: this.port}), listener);
  }
  else {
    this.connection = net.createConnection({host: this.host, port: this.port}, listener);
  }

  this.connection.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
  this.connection.on('close', function() {
    this.connection = null;
    this.closed_callback();
  }.bind(this));
};

AbstractTcp.prototype.process = function(data) {
  this.formatPayload(data, function(message) {
    this.findConnection(function(c) {
      c.write(message);
    });
  }.bind(this));
};

AbstractTcp.prototype.close = function(callback) {
  logger.info('Closing output to' + this.to());
  if (this.connection) {
    this.closed_callback = function() {
      logger.info('Connection closed to' + this.to());
      callback();
    }.bind(this);
    this.connection.end();
  }
  else {
    callback();
  }
};

exports.AbstractTcp = AbstractTcp;