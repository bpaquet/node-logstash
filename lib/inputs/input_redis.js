var base_input = require('../lib/base_input'),
  util = require('util'),
  redis_connection_manager = require('../lib/redis_connection_manager'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function InputRedis() {
  base_input.BaseInput.call(this);
  this.mergeConfig(error_buffer.config(function() {
    return 'input Redis to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Redis',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['type', 'channel', 'key', 'pattern_channel', 'retry', 'auth_pass', 'method'],
    default_values: {
      'method': 'queue',
    },
    start_hook: this.start,
  });
}

util.inherits(InputRedis, base_input.BaseInput);

InputRedis.prototype.processRedisMessage = function(channel, data) {
  this.unserialize_data(data, function(parsed) {
    if (this.type) {
      parsed.type = this.type;
    }
    if (channel) {
      parsed.redis_channel = channel;
    }
    this.emit('data', parsed);
  }.bind(this), function(data) {
    this.emit('error', 'Unable to parse data ' + data);
  }.bind(this));
};

InputRedis.prototype.receivePubSub = function(client) {
  if (this.pattern_channel) {
    client.on('pmessage', function(pattern, channel, data) {
      this.processRedisMessage(channel, data);
    }.bind(this));
    client.psubscribe(this.channel);
    this.redis_connection_manager.on('before_quit', function(client) {
      client.punsubscribe(this.channel);
    });
  }
  else {
    client.on('message', function(channel, data) {
      this.processRedisMessage(channel, data);
    }.bind(this));
    client.subscribe(this.channel);
    this.redis_connection_manager.on('before_quit', function(client) {
      client.unsubscribe(this.channel);
    });
  }
};

InputRedis.prototype.receiveQueue = function(client) {
  client.blpop(this.key, 1, function(err, data) {
    if (data) {
      this.processRedisMessage(undefined, data[1]);
    }
    if (!this.quitting) {
      this.receiveQueue(client);
    }
  }.bind(this));
};

InputRedis.prototype.start = function(callback) {
  if (this.method !== 'queue' && this.method !== 'pubsub') {
    return callback(new Error('Wrong method, please use pubsub or queue : ' + this.method));
  }

  var receive;

  if (this.method === 'pubsub') {
    if (!this.channel) {
      return callback(new Error('You have to specify the channel parameter in pubsub mode'));
    }
    this.desc = 'using pubsub, channel ' + this.channel + ', pattern_channel ' + this.pattern_channel;
    receive = this.receivePubSub.bind(this);
  }

  if (this.method === 'queue') {
    if (!this.key) {
      return callback(new Error('You have to specify the key parameter in queue mode'));
    }
    this.desc = 'using queue, key ' + this.key;
    receive = this.receiveQueue.bind(this);
  }

  logger.info('Start listening Redis on', this.host + ':' + this.port, this.desc);

  this.redis_connection_manager = redis_connection_manager.create(this.host, this.port, this.auth_pass);

  this.redis_connection_manager.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  this.redis_connection_manager.on('connect', function() {
    this.error_buffer.emit('ok');
  }.bind(this));

  this.redis_connection_manager.once('connect', receive);

  callback();
};

InputRedis.prototype.close = function(callback) {
  this.quitting = true;
  this.redis_connection_manager.quit(callback);
};

exports.create = function() {
  return new InputRedis();
};
