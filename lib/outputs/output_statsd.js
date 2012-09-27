var base_output = require('../lib/base_output'),
    util = require('util'),
    logger = require('log4node'),
    dgram = require('dgram'),
    error_buffer = require('../lib/error_buffer.js');

function OutputElasticStatsd() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Statsd',
    host_field: 'host',
    port_field: 'port',
    required_params: ['metric_type', 'metric_key'],
    optional_params: ['metric_value', 'error_buffer_size'],
    default_values: {
      'error_buffer_size': 2000,
    }
  }
}

util.inherits(OutputElasticStatsd, base_output.BaseOutput);

OutputElasticStatsd.prototype.afterLoadConfig = function(callback) {
  logger.info('Start statsd output to ' + this.host + ':' + this.port);
  this.error_buffer = error_buffer.create('output statsd to ' + this.host + ':' + this.port, this.error_buffer_size, this);
  this.client = dgram.createSocket('udp4');
  callback();
}

OutputElasticStatsd.prototype.process = function(data) {
  var raw = "";
  if (this.metric_type == 'counter') {
    if (!this.metric_value) {
      this.error_buffer.emit('error', new Error('No metric_value for metric_type ' + this.metric_type));
      return;
    }
    raw = this.replaceByFields(data, this.metric_key) + ':' + this.replaceByFields(data, this.metric_value) + '|c';
  }
  else if (this.metric_type == 'increment') {
    raw = this.replaceByFields(data, this.metric_key) + ':1|c';
  }
  else if (this.metric_type == 'decrement') {
    raw = this.replaceByFields(data, this.metric_key) + ':-1|c';
  }
  else if (this.metric_type == 'timer') {
    if (!this.metric_value) {
      this.error_buffer.emit('error', new Error('No metric_value for ' + this.metric_type));
      return;
    }
    raw = this.replaceByFields(data, this.metric_key) + ':' + this.replaceByFields(data, this.metric_value) + '|ms';
  }
  else {
    this.error_buffer.emit('error', new Error('Wrong metric_type: ' + this.metric_type));
    return;
  }
  logger.debug('Send to statsd packet', raw);
  var message = new Buffer(raw);
  this.client.send(message, 0, message.length, this.port, this.host, function(err, bytes) {
    if (err || bytes != message.length) {
      this.error_buffer.emit('error', new Error('Error while send data to statsd:' + err));
    }
  }.bind(this));
}

OutputElasticStatsd.prototype.close = function() {
  logger.info('Closing statsd output to ' + this.host.host + ':' + this.host.port);
  this.client.close();
  delete this.client;
}

module.exports = {
  create: function() {
    return new OutputElasticStatsd();
  }
}
