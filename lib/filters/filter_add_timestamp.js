var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterAddTimestamp() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'AddTimestamp',
  }
}

util.inherits(FilterAddTimestamp, base_filter.BaseFilter);

FilterAddTimestamp.prototype.afterLoadConfig = function(callback) {
  callback();
}

FilterAddTimestamp.prototype.process = function(data) {
  if (!data['@timestamp']) {
    data['@timestamp'] = (new Date()).toISOString();
  }
  return data;
}

exports.create = function() {
  return new FilterAddTimestamp();
}