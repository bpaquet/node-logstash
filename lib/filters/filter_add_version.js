var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterAddVersion() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'AddVersion',
  }
}

util.inherits(FilterAddVersion, base_filter.BaseFilter);

FilterAddVersion.prototype.afterLoadConfig = function(callback) {
  callback();
}

FilterAddVersion.prototype.process = function(data) {
  if (!data['@version']) {
    data['@version'] = '1';
  }
  return data;
}

exports.create = function() {
  return new FilterAddVersion();
}
