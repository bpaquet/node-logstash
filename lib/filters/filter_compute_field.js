var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterComputeField() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'ComputeField',
    required_params: ['value'],
    host_field: 'field',
    start_hook: this.start,
  });
}

util.inherits(FilterComputeField, base_filter.BaseFilter);

FilterComputeField.prototype.start = function(callback) {
  logger.info('Initialized compute field filter on field: ' + this.field + ', value: ' + this.value);
  callback();
};

FilterComputeField.prototype.process = function(data) {
  var value = this.replaceByFields(data, this.value);
  if (value) {
    data[this.field] = value;
  }
  return data;
};

exports.create = function() {
  return new FilterComputeField();
};
