var base_input = require('../lib/base_input'),
    util = require('util'),
    redis_connection_manager = require('../lib/redis_connection_manager'),
    logger = require('log4node');

function InputRedis() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Redis',
    host_field: 'host',
    port_field: 'port',
    required_params: ['channel'],
    optional_params: ['pattern_channel', 'retry'],
    default_values: {
      'type': null,
      'pattern_channel': false,
      'retry': 1000,
    }
  }
}

util.inherits(InputRedis, base_input.BaseInput);

InputRedis.prototype.processRedisMessage = function(channel, data) {
  try {
    var parsed = JSON.parse(data);
    if (this.type) {
      parsed['@type'] = this.type;
    }
    if (!parsed['@fields']) {
      parsed['@fields'] = {};
    }
    parsed['@fields']['redis_channel'] = channel;
    this.emit('data', parsed);
  }
  catch(e) {
    this.emit('error', 'Unable to parse data ' + data);
  }
}

InputRedis.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening Redis on', this.host + ':' + this.port, 'channel', this.channel, 'pattern_channel', this.pattern_channel);

  this.redis_connection_manager = redis_connection_manager.create(this.host, this.port, this.retry);

  this.redis_connection_manager.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.redis_connection_manager.once('connect', function (client) {
    if (this.pattern_channel) {
      client.on('pmessage', function (pattern, channel, data) {
        this.processRedisMessage(channel, data);
      }.bind(this));
      client.psubscribe(this.channel);
      this.redis_connection_manager.on('before_quit', function(client) {
        client.punsubscribe(this.channel);
      });
    }
    else {
      client.on('message', function (channel, data) {
        this.processRedisMessage(channel, data);
      }.bind(this));
      client.subscribe(this.channel);
      this.redis_connection_manager.on('before_quit', function(client) {
        client.unsubscribe(this.channel);
      });
    }
  }.bind(this));

  callback();
}

InputRedis.prototype.close = function(callback) {
  this.redis_connection_manager.quit(callback);
}

exports.create = function() {
  return new InputRedis();
}
