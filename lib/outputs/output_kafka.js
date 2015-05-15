var abstract_zeromq = require('./abstract_kafka'),
  util = require('util');

function OutputKafka() {
  abstract_zeromq.AbstractKafka.call(this);
  this.mergeConfig(this.serializer_config());
  this.mergeConfig({
    name: 'Kafka',
  });
}

util.inherits(OutputKafka, abstract_zeromq.AbstractKafka);

OutputKafka.prototype.to = function() {
  return 'Kafka : ' + this.target;
};

OutputKafka.prototype.formatPayload = function(data, callback) {
  callback(this.serialize_data(data));
};

exports.create = function() {
  return new OutputKafka();
};
