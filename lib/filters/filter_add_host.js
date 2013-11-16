var base_filter = require('../lib/base_filter'),
    os = require('os'),
    util = require('util');

function FilterAddHost() {
  base_filter.BaseFilter.call(this);
  this.merge_config({
    name: 'AddHost',
  });
}

util.inherits(FilterAddHost, base_filter.BaseFilter);

FilterAddHost.prototype.afterLoadConfig = function(callback) {
  this.os = os.hostname();
  callback();
};

FilterAddHost.prototype.process = function(data) {
  if (!data.host) {
    data.host = this.os;
  }
  return data;
};

exports.create = function() {
  return new FilterAddHost();
};
