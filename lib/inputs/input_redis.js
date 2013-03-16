var base_input = require('../lib/base_input'),
    util = require('util'),
    redis = require('redis'),
    logger = require('log4node');

function InputRedis() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Tcp',
    host_field: 'target',
    port_field: 'port',
    required_params: ['key'],
    optional_params: ['type', 'data_type'],
    default_values: {
      'type': 'redis',
      'data_type': 'channel',
    }
  }
}

util.inherits(InputRedis, base_input.BaseInput);

InputRedis.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on redis', this.target);

  this.client = redis.createClient(this.port, this.host);

  // Redis Pub/Sub
  if (this.data_type === 'channel' || this.data_type === 'pattern_channel') {

    this.client.on("connect", function () {
      this.emit('init_ok');
    }.bind(this));

    this.client.on("error", function (err) {
      this.emit('init_error', err);
    }.bind(this));

    this.client.on("message", function (channel, data) {
      try {
        var parsed = JSON.parse(data);
        parsed['@type'] = this.type;
        this.emit('data', parsed);
      }
      catch(e) {
        this.emit('error', 'Unable to parse data ' + data);
      }
    }.bind(this));

    if (this.data_type === 'channel') {
      this.client.subscribe(this.key);
    } else if (this.data_type === 'pattern_channel') {
      this.client.psubscribe(this.key);
    }
  } else {
    this.emit('init_error', 'data_type not supported');
  }
}

InputRedis.prototype.close = function(callback) {
  logger.info('Closing input redis', this.target);
  this.client.quit();
  callback();
}

exports.create = function() {
  return new InputRedis();
}
