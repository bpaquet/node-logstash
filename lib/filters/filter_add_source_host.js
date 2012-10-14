var base_filter = require('../lib/base_filter'),
    os = require('os'),
    util = require('util'),
    logger = require('log4node');

function FilterAddSourceHost() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'AddSourceHost',
  }
}

util.inherits(FilterAddSourceHost, base_filter.BaseFilter);

FilterAddSourceHost.prototype.afterLoadConfig = function(callback) {
  this.os = os.hostname();
  callback();
}

FilterAddSourceHost.prototype.process = function(data) {
  if (!data['@source_host']) {
    data['@source_host'] = this.os;
  }
  return data;
}

exports.create = function() {
  return new FilterAddSourceHost();
}
