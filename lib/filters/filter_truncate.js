var base_filter = require('../lib/base_filter'),
  util = require('util');

function FilterTruncate() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Truncate',
    required_params: ['max_size']
  });
}

util.inherits(FilterTruncate, base_filter.BaseFilter);

FilterTruncate.prototype.process = function(data) {
  if (data['message']) {
    data['message'] = data['message'].substring(0, this.max_size);
  }
  return data;
};

exports.create = function() {
  return new FilterTruncate();
};
