var base_input = require('../lib/base_input'),
  util = require('util'),
  kafka = require('kafka-node'),
  logger = require('log4node');

function InputKafka() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Kafka',
    host_field: 'connectionString',
    optional_params: ['type', 'clientId', 'zkOptions', 'topics', 'groupId', 'autoCommitIntervalMs', 'fetchMaxWaitMs', 'fetchMinBytes', 'fetchMaxBytes', 'fromOffset', 'encoding'],
    default_values: {
      type: 'kafka',
      topics: 'logstash',
      groupId: 'kafka-logstash-group', //consumer group id, deafult `kafka-node-group`
      autoCommitIntervalMs: 5000,  // Auto commit config
      fetchMaxWaitMs: 100,         // The max wait time is the maximum amount of time in milliseconds to block waiting if insufficient data is available at the time the request is issued, default 100ms
      fetchMinBytes: 1,            // This is the minimum number of bytes of messages that must be available to give a response, default 1 byte
      fetchMaxBytes: 1024 * 10,    // The maximum bytes to include in the message set for this partition. This helps bound the size of the response.
      fromOffset: false,           // If set true, consumer will fetch message from the given offset in the payloads
      encoding: 'utf8'             // If set to 'buffer', values will be returned as raw buffer objects.
    },
    start_hook: this.start,
  });
}

util.inherits(InputKafka, base_input.BaseInput);

InputKafka.prototype.start = function(callback) {
  logger.info(util.format('Start listening on kafka connectionString: %s, topics: %s', this.connectionString, this.topics));

  this.client = new kafka.Client(this.connectionString);

  var payloads = this.topics.split(',').map(function(topic) {return {topic: topic.trim()};});
  var options = {
    groupId: this.groupId,
    autoCommitIntervalMs: this.autoCommitIntervalMs,
    fetchMaxWaitMs: this.fetchMaxWaitMs,
    fetchMinBytes: this.fetchMinBytes,
    fetchMaxBytes: this.fetchMaxBytes,
    fromOffset: this.fromOffset,
    encoding: this.encoding
  };

  this.consumer = new kafka.HighLevelConsumer(this.client, payloads, options);

  this.consumer.on('message', function(data) {
    this.unserialize_data(data.value, function(parsed) {
      if (this.type) {
        parsed.type = this.type;
      }
      //logger.info(parsed);
      this.emit('data', parsed);
    }.bind(this), function(data) {
      var obj = {
        'message': data.toString().trim(),
        'kafka_from': this.connectionString,
        'type': this.type,
      };
      this.emit('data', obj);
    }.bind(this));
  }.bind(this));

  // TODO: better handling of these errors...
  this.consumer.on('error', function(err) {
    logger.error(err);
  });
  this.consumer.on('offsetOutOfRange', function(err) {
    logger.error(err);
  });

  this.consumer.on('ready', function() {
    logger.info(util.format('Connected and listening on kafka connectionString: %s, topics: %s', this.connectionString, this.topics));
    return callback();
  }.bind(this));
};

InputKafka.prototype.close = function(callback) {
  logger.info(util.format('Closing input from kafka connectionString: %s, topics: %s', this.connectionString, this.topics));
  this.client.close(callback);
};

exports.create = function() {
  return new InputKafka();
};
