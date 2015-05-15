var abstract_kafka = require('./abstract_kafka'),
  util = require('util'),
  moment = require('moment');

function OutputKafkaRiver() {
  abstract_kafka.AbstractKafka.call(this);
  this.mergeConfig(this.serializer_config());
  this.mergeConfig({
    name: 'Kafka River',
    optional_params: ['index_prefix', 'data_type', 'date_format', 'id_field'],
    default_values: {
      index_prefix: 'logstash',
      data_type: 'logs',
      date_format: 'YYYY-MM-DD'
    },
  });
}

util.inherits(OutputKafkaRiver, abstract_kafka.AbstractKafka);

OutputKafkaRiver.prototype.to = function() {
  return 'Elasticsearch Kafka : ' + this.target;
};

OutputKafkaRiver.prototype.formatPayload = function(data, callback) {
  var date = moment.utc();
  if (data['@timestamp']) {
    date = moment(data['@timestamp']);
  }
  var index = util.format('%s-%s', this.index_prefix, date.format(this.date_format));
  var doc = {
    index: index,
    type: this.data_type,
    source: data
  };
  if (this.id_field) {
    doc.id = data[this.id_field];
  }
  return callback(JSON.stringify(doc));
};

exports.create = function() {
  return new OutputKafkaRiver();
};
