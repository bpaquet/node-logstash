var abstract_http = require('./abstract_http'),
  util = require('util'),
  elastic_search_helper = require('../lib/elastic_search_helper');

function OutputElasticSearch() {
  abstract_http.AbstractHttp.call(this);
  this.mergeConfig({
    name: 'Elastic search',
    optional_params: ['bulk', 'bulk_limit', 'bulk_timeout', 'index_type', 'data_type'],
    default_values: {
      'index_type': 'logstash',
      'data_type': 'logs',
      'bulk': 'false',
      'bulk_limit': '100',
      'bulk_timeout': '1000'
    },
    start_hook: this.start,
  });
}

util.inherits(OutputElasticSearch, abstract_http.AbstractHttp);

OutputElasticSearch.prototype.start = function(callback) {
  this.bulk = JSON.parse(this.bulk);
  if (this.bulk) {
    this.bulkData = [];
    this.bulkLimit = parseInt(this.bulk_limit);
    this.bulkTimeout = parseInt(this.bulk_timeout);
  }
  callback();
};

OutputElasticSearch.prototype.bulkPostData = function(path, data, callback) {
  this.bulkData.push(data);

  var doPost = function() {
    clearTimeout(this.bulkTimer);
    this.bulkTimer = null;
    path = path + '/_bulk';
    // build the bulk request payload
    var payload = elastic_search_helper.buildBulkPayload(this.bulkData);
    this.bulkData = [];
    // send the bulk request
    this.postData(path, payload, callback);
  }.bind(this);

  // immediately post if we reached the bulk limit
  if (this.bulkData.length === this.bulkLimit) {
    doPost();
    return;
  }

  // register a timer to post
  if (!this.bulkTimer) {
    this.bulkTimer = setTimeout(function() {
      doPost();
    }.bind(this), this.bulkTimeout);
  }

};

OutputElasticSearch.prototype.postData = function(path, data, callback) {
  var params = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: path,
  };

  callback(params, data);
};

OutputElasticSearch.prototype.formatPayload = function(data, callback) {
  // if bulk operation then store messages in memory and emit only when reached bulk size messages or timeout elapsed
  var path = elastic_search_helper.computePath(this.index_type, this.data_type);
  if (this.bulk) {
    this.bulkPostData(path, JSON.stringify(data), callback);
  } else {
    this.postData(path, JSON.stringify(data), callback);
  }
};

OutputElasticSearch.prototype.to = function() {
  return ' Elastic Search Http ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputElasticSearch();
};
