var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterRemoveFieldWhenEqual() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'RemoveFieldWhenEqual',
    host_field: 'field',
    required_params: ['value'],
    start_hook: this.start,
  });
}

util.inherits(FilterRemoveFieldWhenEqual, base_filter.BaseFilter);

FilterRemoveFieldWhenEqual.prototype.start = function(callback) {
  logger.info('Initialized remove field', this.field, 'when equal to', this.value);
  callback();
};

FilterRemoveFieldWhenEqual.prototype.process = function(data) {
  if (data[this.field] && data[this.field] === this.value) {
    delete data[this.field];
  }
  return data;
};

exports.create = function() {
  return new FilterRemoveFieldWhenEqual();
};
