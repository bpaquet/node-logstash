var base_output = require('../lib/base_output'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputTCP() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Tcp',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['error_buffer_delay', 'format', 'serializer'],
    default_values: {
      'error_buffer_delay': 2000,
      'format': '#{@message}',
      'serializer': 'json_logstash',
    }
  }
}

util.inherits(OutputTCP, base_output.BaseOutput);

OutputTCP.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to tcp', this.host + ':' + this.port);

  this.configure_serialize(this.serializer, this.format);

  this.error_buffer = error_buffer.create('output tcp to ' + this.host + ':' + this.port, this.error_buffer_delay, this);
  callback();
}

OutputTCP.prototype.process = function(data) {
  var c = net.createConnection({host: this.host, port: this.port}, function() {
    c.write(this.serialize_data(data));
    c.end();
  }.bind(this));
  c.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
}

OutputTCP.prototype.close = function(callback) {
  logger.info('Closing output to tcp', this.host + ':' + this.port);
  callback();
}

exports.create = function() {
  return new OutputTCP();
}
