var base_output = require('../lib/base_output'),
    util = require('util'),
    logger = require('log4node'),
    dgram = require('dgram'),
    error_buffer = require('../lib/error_buffer');

function OutputElasticStatsd() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Statsd',
    host_field: 'host',
    port_field: 'port',
    required_params: ['metric_type', 'metric_key'],
    optional_params: ['metric_value', 'error_buffer_delay'],
    default_values: {
      'error_buffer_delay': 2000,
    }
  }
}

util.inherits(OutputElasticStatsd, base_output.BaseOutput);

OutputElasticStatsd.prototype.afterLoadConfig = function(callback) {
  logger.info('Start statsd output to', this.host + ':' + this.port, ', metric_type', this.metric_type, ', metric_key', this.metric_key);

  if (this.metric_type == 'counter') {
    if (!this.metric_value) {
      this.emit('init_error', new Error('You have to specify metric_value with metric_type counter'));
      return callback(true);
    }
    this.raw = this.metric_key + ':' + this.metric_value + '|c';
  }
  else if (this.metric_type == 'increment') {
    this.raw = this.metric_key + ':1|c';
  }
  else if (this.metric_type == 'decrement') {
    this.raw = this.metric_key + ':-1|c';
  }
  else if (this.metric_type == 'timer') {
    if (!this.metric_value) {
      this.emit('init_error', new Error('You have to specify metric_value with metric_type timer'));
      return callback(true);
    }
    this.raw = this.metric_key + ':' + this.metric_value + '|ms';
  }
  else if (this.metric_type == 'gauge') {
    if (!this.metric_value) {
      this.emit('init_error', new Error('You have to specify metric_value with metric_type gauge'));
        return callback(true);
    }
    this.raw = this.metric_key + ':' + this.metric_value + '|g';
  }
  else {
    this.emit('init_error', new Error('Wrong metric_type: ' + this.metric_type));
    return callback(true);
  }

  this.error_buffer = error_buffer.create('output statsd to ' + this.host + ':' + this.port, this.error_buffer_delay, this);

  this.client = dgram.createSocket('udp4');

  callback();
}

OutputElasticStatsd.prototype.process = function(data) {
  var raw = this.replaceByFields(data, this.raw);
  if (raw) {
    logger.debug('Send to statsd packet', raw);
    var message = new Buffer(raw);
    this.client.send(message, 0, message.length, this.port, this.host, function(err, bytes) {
      if (err || bytes != message.length) {
        this.error_buffer.emit('error', new Error('Error while send data to statsd:' + err));
      }
    }.bind(this));
  }
  else {
    logger.debug('Unable to replace fields on', this.raw, 'input', data);
  }
}

OutputElasticStatsd.prototype.close = function(callback) {
  logger.info('Closing output to statsd', this.host + ':' + this.port);
  this.client.close();
  delete this.client;
  callback();
}

exports.create = function() {
  return new OutputElasticStatsd();
}
