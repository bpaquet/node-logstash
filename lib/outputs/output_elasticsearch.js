var abstract_http = require('./abstract_http'),
  util = require('util'),
  elastic_search_helper = require('../lib/elastic_search_helper');

function OutputElasticSearch() {
  abstract_http.AbstractHttp.call(this);
  this.mergeConfig({
    name: 'Elastic search',
    optional_params: ['bulk_limit', 'bulk_timeout', 'index_prefix', 'data_type'],
    default_values: {
      'index_prefix': 'logstash',
      'data_type': 'logs',
      'bulk': 'false',
      'bulk_timeout': '1000'
    },
    start_hook: this.start,
  });
}

util.inherits(OutputElasticSearch, abstract_http.AbstractHttp);

OutputElasticSearch.prototype.start = function(callback) {
  if (this.bulk_limit) {
    this.bulk_limit = parseInt(this.bulk_limit, 10);
    this.bulk_timeout = parseInt(this.bulk_timeout, 10);
    this.bulk_data = [];
    this.bulk_interval = setInterval(function() {
      if (this.bulk_data.length > 0 && ((new Date()).getTime() - this.last_bulk_insert) > this.bulk_timeout) {
        this.sendBulk();
      }
    }.bind(this), this.bulk_timeout);
  }

  callback();
};

OutputElasticSearch.prototype.sendBulk = function() {
  var path = elastic_search_helper.computePath(this.index_prefix, this.data_type) + '/_bulk';
  var payload = elastic_search_helper.buildBulkPayload(this.bulk_data);
  this.bulk_data = [];
  this.postData(path, payload);
};

OutputElasticSearch.prototype.postData = function(path, data) {
  var params = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: path,
  };

  this.sendHttpRequest(params, data);
};

OutputElasticSearch.prototype.process = function(data) {
  if (this.bulk_limit) {
    this.bulk_data.push(data);
    this.last_bulk_insert = (new Date()).getTime();
    if (this.bulk_data.length === this.bulk_limit) {
      this.sendBulk();
    }
  }
  else {
    this.postData(elastic_search_helper.computePath(this.index_prefix, this.data_type), JSON.stringify(data));
  }
};

OutputElasticSearch.prototype.httpClose = function(callback) {
  if (this.bulk_interval) {
    clearInterval(this.bulk_interval);
  }
  callback();
};

OutputElasticSearch.prototype.to = function() {
  return ' Elastic Search Http ' + this.host + ':' + this.port + (this.bulk_limit ? ' bulk ' + this.bulk_limit : '');
};

exports.create = function() {
  return new OutputElasticSearch();
};
