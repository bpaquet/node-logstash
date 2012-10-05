var base_output = require('../lib/base_output'),
    util = require('util'),
    zmq = require('zmq'),
    elastic_search_helper = require('../lib/elastic_search_helper'),
    logger = require('log4node');

function OutputElasticSearchZeroMQ() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Elasticsearch zeromq',
    host_field: 'target',
    optional_params: ['data_type'],
    default_values: {
      'data_type': 'data',
    }
  }
}

util.inherits(OutputElasticSearchZeroMQ, base_output.BaseOutput);

OutputElasticSearchZeroMQ.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to elasticsearch zeromq', this.target);

  this.socket = zmq.socket('push');
  this.socket.connect(this.target);

  callback();
}

OutputElasticSearchZeroMQ.prototype.process = function(data) {
  var line = 'POST|' + elastic_search_helper.computePath(this.data_type) + '|' + JSON.stringify(data);
  this.socket.send(line);
}

OutputElasticSearchZeroMQ.prototype.close = function(callback) {
  logger.info('Closing output to elasticsearch zeromq', this.target);
  this.socket.close();
  callback();
}

exports.create = function() {
  return new OutputElasticSearchZeroMQ();
}
