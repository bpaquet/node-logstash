var abstract_http = require('./abstract_http'),
    util = require('util'),
    elastic_search_helper = require('../lib/elastic_search_helper');

function OutputElasticSearch() {
  abstract_http.AbstractHttp.call(this);
  this.merge_config({
    name: 'Elastic search',
    optional_params: ['data_type'],
    default_values: {
      'data_type': 'data',
    }
  });
}

util.inherits(OutputElasticSearch, abstract_http.AbstractHttp);

OutputElasticSearch.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(callback);
};

OutputElasticSearch.prototype.format_payload = function(data, callback) {
  var params = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: elastic_search_helper.computePath(this.data_type),
  };

  var json = JSON.stringify(data);

  callback(params, json);
};

OutputElasticSearch.prototype.to = function() {
  return ' Elastic Search Http ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputElasticSearch();
};
