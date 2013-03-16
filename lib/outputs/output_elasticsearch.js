var base_output = require('../lib/base_output'),
    util = require('util'),
    http = require('http'),
    logger = require('log4node'),
    elastic_search_helper = require('../lib/elastic_search_helper'),
    error_buffer = require('../lib/error_buffer');

function OutputElasticSearch() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'ElasticSearch',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['error_buffer_delay', 'data_type'],
    default_values: {
      'error_buffer_delay': 2000,
      'data_type': 'data',
    }
  }
}

util.inherits(OutputElasticSearch, base_output.BaseOutput);

OutputElasticSearch.prototype.afterLoadConfig = function(callback) {
  logger.info('Start ElasticSearch output to ' + this.host + ':' + this.port);
  this.error_buffer = error_buffer.create('output ElasticSearch to ' + this.host + ':' + this.port, this.error_buffer_delay, this);
  callback();
}

OutputElasticSearch.prototype.process = function(data) {
  var params = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: elastic_search_helper.computePath(this.data_type),
  };

  var json = JSON.stringify(data);

  var req = http.request(params, function(res) {
    if (res.statusCode != 201) {
      this.error_buffer.emit('error', new Error('Wrong ElasticSearch return code ' + res.statusCode + ', should be 201. Data: ' + json));
    }
    else {
      this.error_buffer.emit('ok');
    }
    res.on('data', function() {});
  }.bind(this));

  req.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  req.end(json);
}

OutputElasticSearch.prototype.close = function(callback) {
  logger.info('Closing output to ElasticSearch', this.host + ':' + this.port);
  callback();
}

exports.create = function() {
  return new OutputElasticSearch();
}
