var abstract_udp = require('./abstract_udp'),
    util = require('util'),
    logger = require('log4node');

function OutputElasticStatsd() {
  abstract_udp.AbstractUdp.call(this);
  this.config.name = 'Statsd';
  this.config.required_params.push('metric_type');
  this.config.required_params.push('metric_key');
  this.config.optional_params.push('metric_value');
}

util.inherits(OutputElasticStatsd, abstract_udp.AbstractUdp);

OutputElasticStatsd.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(function() {

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

    callback();
  }.bind(this));
}

OutputElasticStatsd.prototype.format_payload = function(data, callback) {
  var raw = this.replaceByFields(data, this.raw);
  if (raw) {
    logger.debug('Send to statsd packet', raw);
    var message = new Buffer(raw);
    callback(message);
  }
  else {
    logger.debug('Unable to replace fields on', this.raw, 'input', data);
  }
}

OutputElasticStatsd.prototype.to = function() {
  return ' statsd ' + this.host + ':' + this.port + ' , metric_type ' + this.metric_type + ' , metric_key ' + this.metric_key;
}

exports.create = function() {
  return new OutputElasticStatsd();
}
