var base_output = require('../lib/base_output'),
  util = require('util'),
  redis_connection_manager = require('../lib/redis_connection_manager'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function OutputRedis() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(this.serializer_config());
  this.mergeConfig(error_buffer.config(function() {
    return 'output Redis to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig({
    name: 'Redis',
    host_field: 'host',
    port_field: 'port',
    required_params: ['channel'],
    optional_params: ['auth_pass', 'method'],
    default_values: {
      method: 'blpop'
    },
    start_hook: this.start,
  });
}

util.inherits(OutputRedis, base_output.BaseOutput);

OutputRedis.prototype.start = function(callback) {
  if (this.method !== 'blpop' && this.method !== 'pubsub') {
    return callback(new Error('Wrong method, please use pubsub or blpop : ' + this.method));
  }

  logger.info('Start Redis output to', this.host + ':' + this.port, 'using channel', this.channel, 'mode', this.method);

  this.redis_connection_manager = redis_connection_manager.create(this.host, this.port, this.auth_pass);

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
  if (this.client) {
    var res = this.method === 'pubsub' ? this.client.publish(channel, this.serialize_data(data)) : this.client.rpush(channel, this.serialize_data(data));
    if (!res) {
      this.error_buffer.emit('error', 'Unable to publish or push message on redis');
    }
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
