var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterComputeField() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'ComputeField',
    required_params: ['value'],
    host_field: 'field_name',
  }
}

util.inherits(FilterComputeField, base_filter.BaseFilter);

FilterComputeField.prototype.afterLoadConfig = function(callback) {
  logger.info('Initialized compute field filter on field: ' + this.field_name + ', value: ' + this.value);
  callback();
}

FilterComputeField.prototype.process = function(data) {
  var value = this.replaceByFields(data, this.value);
  if (value) {
    if (!data['@fields']) {
      data['@fields'] = {};
    }
    data['@fields'][this.field_name] = value;
  }
  return data;
}

exports.create = function() {
  return new FilterComputeField();
}
