var base_output = require('../lib/base_output'),
  util = require('util'),
  kafka = require('kafka-node'),
  logger = require('log4node');

function AbstractKafka() {
  base_output.BaseOutput.call(this);
  this.mergeConfig({
    name: 'Abstract Kafka',
    host_field: 'connectionString',
    optional_params: ['clientId', 'zkOptions', 'topic'],
    default_values: {
      clientId: 'node-logstash-output',
      topic: 'logstash'
    },
    start_hook: this.startAbstract,
  });
}

util.inherits(AbstractKafka, base_output.BaseOutput);

AbstractKafka.prototype.startAbstract = function(callback) {
  logger.info('Start output to', this.connectionString, 'using kafka-node');

  this.client = new kafka.Client(this.connectionString);
  this.producer = new kafka.HighLevelProducer(this.client);
  if (!this.topic) {
    this.topic = 'logstash';
  }
  this.producer.on('ready', callback);
};

AbstractKafka.prototype.process = function(data) {
  this.formatPayload(data, function(message) {
    var payload = [{topic: this.topic, messages: message}]
    this.producer.send(payload, function(err, data) {
      if (err) {
        // TODO: go into alarm mode?
        logger.error(err);
      }
      else {
        logger.debug(data);
      }
    });
  }.bind(this));
};

AbstractKafka.prototype.close = function(callback) {
  logger.info('Closing output to kafka', this.connectionString);
  this.client.close(callback);
};

exports.AbstractKafka = AbstractKafka;
