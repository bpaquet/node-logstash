var base_input = require('../lib/base_input'),
    util = require('util'),
    redis = require('redis'),
    logger = require('log4node');

function InputRedis() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Redis',
    host_field: 'host',
    port_field: 'port',
    required_params: ['channel'],
    optional_params: ['pattern_channel', 'db'],
    default_values: {
      'type': null,
      'pattern_channel': false,
      'db': 0,
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
  logger.info('Start listening Redis on', this.host + ':' + this.port, 'db', this.db, 'channel', this.channel, 'pattern_channel', this.pattern_channel);

  this.client = redis.createClient(this.port, this.host);

  this.client.on('connect', function () {
    if (this.pattern_channel) {
      this.client.on('pmessage', function (pattern, channel, data) {
        this.processRedisMessage(channel, data);
      }.bind(this));
      this.client.psubscribe(this.channel);
    }
    else {
      this.client.on('message', function (channel, data) {
        this.processRedisMessage(channel, data);
      }.bind(this));
      this.client.subscribe(this.channel);
    }

    this.emit('init_ok');
  }.bind(this));

  this.client.on('error', function (err) {
    this.emit('init_error', err);
  }.bind(this));

  this.client.on('end', function() {
    logger.info('Redis connection lost to ' + this.host + ':' + this.port);
  });
}

InputRedis.prototype.close = function(callback) {
  if (this.client) {
    logger.info('Closing input Redis', this.host + ':' + this.port);
    this.client.quit();
  }
  callback();
}

exports.create = function() {
  return new InputRedis();
}
