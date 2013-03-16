var base_output = require('../lib/base_output'),
    util = require('util'),
    redis = require('redis'),
    logger = require('log4node');
    error_buffer = require('../lib/error_buffer');

function OutputRedis() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Redis',
    host_field: 'host',
    port_field: 'port',
    required_params: ['channel'],
    optional_params: ['db'],
    default_values: {
      'db': 0
    }
  }
}

util.inherits(OutputRedis, base_output.BaseOutput);

OutputRedis.prototype.afterLoadConfig = function(callback) {
  logger.info('Start Redis output to', this.host + ':' + this.port, 'db', this.db, 'using channel', this.channel);

  this.client = redis.createClient(this.port, this.host);
  this.end_callback = function() {
    logger.info('Redis connection lost to ' + this.host + ':' + this.port);
  }
  this.client.on('end', function() {
    this.end_callback();
  }.bind(this));

  this.client.on('connect', function () {
    callback();
  }.bind(this));

  this.client.on('error', function (err) {
    this.emit('init_error', err);
  }.bind(this));
}

OutputRedis.prototype.process = function(data) {
  var channel = this.replaceByFields(data, this.channel);
  this.client.publish(channel, JSON.stringify(data));
}

OutputRedis.prototype.close = function(callback) {
  if (this.client) {
    logger.info('Closing output to Redis', this.host + ':' + this.port);
    this.end_callback = callback;
    this.client.quit();
    this.client = undefined;
  }
}

exports.create = function() {
  return new OutputRedis();
}
