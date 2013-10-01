var base_output = require('../lib/base_output'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function AbstractTcp() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'AbstractTcp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['error_buffer_delay'],
    default_values: {
      'error_buffer_delay': 2000,
    }
  }
}

util.inherits(AbstractTcp, base_output.BaseOutput);

AbstractTcp.prototype.abstractAfterLoadConfig = function(callback) {
  logger.info('Start output to' + this.to());

  this.error_buffer = error_buffer.create('output tcp to ' + this.host + ':' + this.port, this.error_buffer_delay, this);

  this.closed_callback = function() {};

  callback();
}

AbstractTcp.prototype.find_connection = function(callback) {
  if (this.connection) {
    return callback(this.connection);
  }
  this.connection = net.createConnection({host: this.host, port: this.port}, function() {
    callback(this.connection);
  }.bind(this));
  this.connection.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
  this.connection.on('close', function() {
    this.connection = null;
    this.closed_callback();
  }.bind(this));
}

AbstractTcp.prototype.process = function(data) {
  this.format_payload(data, function(message) {
    this.find_connection(function(c) {
      c.write(message);
    })
  }.bind(this));
}

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
}

exports.AbstractTcp = AbstractTcp;