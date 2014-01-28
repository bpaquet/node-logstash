var base_filter = require('../lib/base_filter'),
  util = require('util');

function FilterAddTimestamp() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'AddTimestamp',
  });
}

util.inherits(FilterAddTimestamp, base_filter.BaseFilter);

FilterAddTimestamp.prototype.process = function(data) {
  if (!data['@timestamp']) {
    data['@timestamp'] = (new Date()).toISOString();
  }
  return data;
};

exports.create = function() {
  return new FilterAddTimestamp();
};
