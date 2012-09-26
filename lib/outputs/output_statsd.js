var events = require('events'),
    util = require('util'),
    logger = require('log4node'),
    dgram = require('dgram'),
    error_buffer = require('../lib/error_buffer.js'),
    fields_tools= require('../lib/fields_tools'),
    url_parser = require('../lib/url_parser');

function OutputElasticStatsd() {
  events.EventEmitter.call(this);
}

util.inherits(OutputElasticStatsd, events.EventEmitter);


OutputElasticStatsd.prototype.replaceByFields = function(data, s) {
  return fields_tools.replace(data, s, function(err) {
    this.emit('error', err);
  }.bind(this));
}

OutputElasticStatsd.prototype.init = function(url) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return this.emit('init_error', 'Unable to parse config : ' + url);
  }

  this.host = url_parser.extractPortNumber(this.config.host);

  if (!this.host) {
    return this.emit('init_error', 'Unable to parse host : ' + this.config.host);
  }

  if (!this.config.params.metric_type) {
    return this.emit('init_error', 'No metric_type specified');
  }

  if (!this.config.params.metric_key) {
    return this.emit('init_error', 'No metric_key specified');
  }

  logger.info('Start statsd output to ' + this.host.host + ':' + this.host.port);

  this.error_buffer = error_buffer.create('output statsd to ' + this.host.host + ':' + this.host.port, 2000, this);

  this.client = dgram.createSocket('udp4');

  this.on('data', function(data) {
    if (!this.config.params.type || this.config.params.type == data['@type']) {
      var raw = "";
      if (this.config.params.metric_type == 'counter') {
        if (!this.config.params.metric_value) {
          this.error_buffer.emit('error', new Error('No metric_value for metric_type ' + this.config.params.metric_type));
          return;
        }
        raw = this.replaceByFields(data, this.config.params.metric_key) + ':' + this.replaceByFields(data, this.config.params.metric_value) + '|c';
      }
      else if (this.config.params.metric_type == 'increment') {
        raw = this.replaceByFields(data, this.config.params.metric_key) + ':1|c';
      }
      else if (this.config.params.metric_type == 'decrement') {
        raw = this.replaceByFields(data, this.config.params.metric_key) + ':-1|c';
      }
      else if (this.config.params.metric_type == 'timer') {
        if (!this.config.params.metric_value) {
          this.error_buffer.emit('error', new Error('No metric_value for ' + this.config.params.metric_type));
          return;
        }
        raw = this.replaceByFields(data, this.config.params.metric_key) + ':' + this.replaceByFields(data, this.config.params.metric_value) + '|ms';
      }
      else {
        this.error_buffer.emit('error', new Error('Wrong metric_type: ' + this.config.params.metric_type));
        return;
      }
      logger.debug('Send to statsd packet', raw);
      var message = new Buffer(raw);
      this.client.send(message, 0, message.length, this.host.port, this.host.host, function(err, bytes) {
        if (err || bytes != message.length) {
          this.error_buffer.emit('error', new Error('Error while send data to statsd:' + err));
        }
      }.bind(this));
    }
  }.bind(this));

  this.emit('init_ok');
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
