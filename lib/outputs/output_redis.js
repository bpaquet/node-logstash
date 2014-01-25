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
    optional_params: ['auth_pass', 'method', 'key', 'channel'],
    default_values: {
      method: 'queue'
    },
    start_hook: this.start,
  });
}

util.inherits(OutputRedis, base_output.BaseOutput);

OutputRedis.prototype.sendQueue = function(data) {
  var key = this.replaceByFields(data, this.key);
  if (!this.client.rpush(key, this.serialize_data(data))) {
    this.error_buffer.emit('error', 'Unable to rpush message on redis to key ' + key);
  }
};

OutputRedis.prototype.sendPubSub = function(data) {
  var channel = this.replaceByFields(data, this.channel);
  if (!this.client.publish(channel, this.serialize_data(data))) {
    this.error_buffer.emit('error', 'Unable to publish message on redis to channel ' + channel);
  }
};

OutputRedis.prototype.start = function(callback) {
  if (this.method !== 'queue' && this.method !== 'pubsub') {
    return callback(new Error('Wrong method, please use pubsub or queue : ' + this.method));
  }

  if (this.method === 'pubsub') {
    if (!this.channel) {
      return callback(new Error('You have to specify the channel parameter in pubsub mode'));
    }
    this.desc = 'using pubsub, channel ' + this.channel;
    this.send = this.sendPubSub.bind(this);
  }

  if (this.method === 'queue') {
    if (!this.key) {
      return callback(new Error('You have to specify the key parameter in queue mode'));
    }
    this.desc = 'using queue, key ' + this.key;
    this.send = this.sendQueue.bind(this);
  }

  logger.info('Start Redis output to', this.host + ':' + this.port, this.desc);

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
  if (this.client) {
    this.send(data);
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
