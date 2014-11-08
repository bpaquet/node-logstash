var base_output = require('../lib/base_output'),
  amqp_driver = require('../lib/amqp_driver'),
  util = require('util'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function OutputAmqp() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(this.serializer_config('json_logstash'));
  this.mergeConfig(error_buffer.config(function() {
    return 'amqp to ' + this.host + ':' + this.port + ' exchange ' + this.exchange_name;
  }));
  this.mergeConfig({
    name: 'Ampq',
    host_field: 'host',
    port_field: 'port',
    required_params: ['exchange_name'],
    optional_params: ['topic', 'durable', 'retry_delay', 'heartbeat'],
    default_values: {
      'durable': true,
      'retry_delay': 3000,
      'heartbeat': 10,
    },
    start_hook: this.start,

  });
}

util.inherits(OutputAmqp, base_output.BaseOutput);

OutputAmqp.prototype.start = function(callback) {
  logger.info('Start AMQP output to', this.host + ':' + this.port, 'exchange', this.exchange_name, 'topic', this.topic);

  this.channel = undefined;

  var options = {
    url: 'amqp://' + this.host + ':' + this.port,
    connected_callback: function(channel) {
      channel.assertExchange(this.exchange_name, this.topic ? 'topic' : 'fanout', {durable: this.durable}, function(err) {
        if (err) {
          logger.error('Unable to create exchange', err);
        }
        else {
          this.channel = channel;
        }
      }.bind(this));
    }.bind(this),
    disconnected_callback: function() {
      this.channel = undefined;
    },
    heartbeat: this.heartbeat,
    retry_delay: this.retry_delay,
    logger: logger,
  };

  this.driver = amqp_driver.create_amqp_client(options);

  callback();
};

OutputAmqp.prototype.process = function(data) {
  if (this.channel) {
    this.channel.publish(this.exchange_name, this.topic || '', new Buffer(this.serialize_data(data)));
  }
};

OutputAmqp.prototype.close = function(callback) {
  logger.info('Closing AMQP output tcp', this.host + ':' + this.port + ' exchange ' + this.exchange_name);
  this.driver.close(callback);
};

exports.create = function() {
  return new OutputAmqp();
};
