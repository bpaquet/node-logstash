var abstract_udp = require('./abstract_udp'),
  util = require('util'),
  logger = require('log4node');

function OutputDatadog() {
  abstract_udp.AbstractUdp.call(this);
  this.mergeConfig({
    name: 'Datadog',
    required_params: ['metric_type', 'metric_key'],
    optional_params: ['metric_value','tags'],
    start_hook: this.start
  });
}

util.inherits(OutputDatadog, abstract_udp.AbstractUdp);

OutputDatadog.prototype.start = function(callback) {
  if (this.metric_type === 'counter') {
    if (!this.metric_value) {
      return callback(new Error('You have to specify metric_value with metric_type counter'));
    }
    this.raw = this.metric_key + ':' + this.metric_value + '|c';
  }
  else if (this.metric_type === 'increment') {
    this.raw = this.metric_key + ':1|c';
  }
  else if (this.metric_type === 'decrement') {
    this.raw = this.metric_key + ':-1|c';
  }
  else if (this.metric_type === 'timer') {
    if (!this.metric_value) {
      return callback(new Error('You have to specify metric_value with metric_type timer'));
    }
    this.raw = this.metric_key + ':' + this.metric_value + '|ms';
  }
  else if (this.metric_type === 'gauge') {
	  if (!this.metric_value) {
		  return callback(new Error('You have to specify metric_value with metric_type gauge'));
	  }
	  this.raw = this.metric_key + ':' + this.metric_value + '|g';
  }
  else if (this.metric_type === 'histogram') {
	  if (!this.metric_value) {
		  return callback(new Error('You have to specify metric_value with metric_type histogram'));
	  }
	  this.raw = this.metric_key + ':' + this.metric_value + '|h';
  }
  else if (this.metric_type === 'set') {
	  if (!this.metric_value) {
		  return callback(new Error('You have to specify metric_value with metric_type histogram'));
	  }
	  this.raw = this.metric_key + ':' + this.metric_value + '|s';
  }
  else {
    return callback(new Error('Wrong metric_type: ' + this.metric_type));
  }

  if (this.raw && this.tags){
    this.raw = this.raw + "|#" + this.tags;
  }

  callback();
};

OutputDatadog.prototype.formatPayload = function(data, callback) {
  var raw = this.replaceByFields(data, this.raw);
  if (raw) {
    logger.debug('Send to datadog packet', raw);
    var message = new Buffer(raw);
    callback(message);
  }
  else {
    logger.debug('Unable to replace fields on', this.raw, 'input', data);
  }
};

OutputDatadog.prototype.to = function() {
  return ' datadog ' + this.host + ':' + this.port + ', metric_type ' + this.metric_type + ', metric_key ' + this.metric_key + ', tags: ' + this.tags;
};

exports.create = function() {
  return new OutputDatadog();
};
