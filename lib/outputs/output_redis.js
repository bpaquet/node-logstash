var base_output = require('../lib/base_output'),
    util = require('util'),
    redis_connection_manager = require('../lib/redis_connection_manager'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputRedis() {
  base_output.BaseOutput.call(this);
  this.merge_config({
    name: 'Redis',
    host_field: 'host',
    port_field: 'port',
    required_params: ['channel'],
  });
  this.merge_config(this.serializer_config());
  this.merge_config(error_buffer.config(function() {
    return 'output Redis to ' + this.host + ':' + this.port;
  }));
}

util.inherits(OutputRedis, base_output.BaseOutput);

OutputRedis.prototype.afterLoadConfig = function(callback) {
  logger.info('Start Redis output to', this.host + ':' + this.port, 'using channel', this.channel);

  this.redis_connection_manager = redis_connection_manager.create(this.host, this.port);

  this.redis_connection_manager.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  this.redis_connection_manager.on('connect', function() {
    this.error_buffer.emit('ok');
  }.bind(this));

  this.redis_connection_manager.once('connect', function(client) {
    this.client = client;
  }.bind(this));

  callback();
};

OutputRedis.prototype.process = function(data) {
  var channel = this.replaceByFields(data, this.channel);
  if (! this.client || !this.client.publish(channel, this.serialize_data(data))) {
    this.error_buffer.emit('error', 'Unable to publish message on redis');
  }
  else {
    this.error_buffer.emit('ok');
  }
};

OutputRedis.prototype.close = function(callback) {
  this.redis_connection_manager.quit(callback);
};

exports.create = function() {
  return new OutputRedis();
};
