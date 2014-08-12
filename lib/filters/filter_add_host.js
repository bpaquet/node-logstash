var base_filter = require('../lib/base_filter'),
  os = require('os'),
  util = require('util');

function FilterAddHost() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'AddHost',
    start_hook: this.start,
  });
}

util.inherits(FilterAddHost, base_filter.BaseFilter);

FilterAddHost.prototype.start = function(callback) {
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
