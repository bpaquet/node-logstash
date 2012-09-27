var base_output = require('../lib/base_output'),
    util = require('util'),
    http = require('http'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer.js');

function OutputElasticSearch() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'ElasticSearch',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['error_buffer_size', 'data_type'],
    default_values: {
      'error_buffer_size': 2000,
      'data_type': 'data',
    }
  }
}

util.inherits(OutputElasticSearch, base_output.BaseOutput);

function fill0(s, k) {
  return s.length == k ? s : '0' + fill0(s, k -1);
}

function formatDate() {
  var now = new Date();
  var year = now.getFullYear();
  var month = fill0((now.getMonth() + 1) + '', 2);
  var day = fill0((now.getDate()) + '', 2);
  return year + '.' + month + '.' + day;
}

OutputElasticSearch.prototype.computePath = function() {
  return '/logstash-' + formatDate() + '/' + this.data_type;
}

OutputElasticSearch.prototype.afterLoadConfig = function(callback) {
  logger.info('Start ElasticSearch output to ' + this.host + ':' + this.port);
  this.error_buffer = error_buffer.create('output ElasticSearch to ' + this.host + ':' + this.port, this.error_buffer_size, this);
  callback();
}

OutputElasticSearch.prototype.process = function(data) {
  var params = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: this.computePath(),
  };

  var json = JSON.stringify(data);

  var req = http.request(params, function(res) {
    if (res.statusCode != 201) {
      this.error_buffer.emit('error', new Error('Wrong ElasticSearch return code ' + res.statusCode + ', should be 201. Data: ' + json));
    }
    else {
      this.error_buffer.emit('ok');
    }
  }.bind(this));

  req.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  req.end(json);
}

OutputElasticSearch.prototype.close = function() {
  logger.info('Closing output to ElasticSearch', this.host + ':' + this.port);
}

exports.create = function() {
  return new OutputElasticSearch();
}
