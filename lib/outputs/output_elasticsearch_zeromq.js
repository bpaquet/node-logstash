var abstract_zeromq = require('./abstract_zeromq'),
  util = require('util'),
  elastic_search_helper = require('../lib/elastic_search_helper');

function OutputElasticSearchZeroMQ() {
  abstract_zeromq.AbstractZeroMQ.call(this);
  this.mergeConfig(this.serializer_config());
  this.mergeConfig({
    name: 'Elasticsearch ZeroMQ',
    optional_params: ['index_prefix', 'data_type'],
    default_values: {
      index_prefix: 'logstash',
      data_type: 'logs',
    },
  });
}

util.inherits(OutputElasticSearchZeroMQ, abstract_zeromq.AbstractZeroMQ);

OutputElasticSearchZeroMQ.prototype.to = function() {
  return 'Elasticsearch Zeromq : ' + this.target;
};

OutputElasticSearchZeroMQ.prototype.formatPayload = function(data, callback) {
  var line = 'POST|' + elastic_search_helper.computePath(this.index_prefix, this.data_type) + '|' + JSON.stringify(data);
  callback(line);
};

exports.create = function() {
  return new OutputElasticSearchZeroMQ();
};
