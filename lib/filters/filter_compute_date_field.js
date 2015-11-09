var base_filter = require('../lib/base_filter'),
  util = require('util'),
  moment = require('moment'),
  logger = require('log4node');

function FilterComputeDateField() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'ComputeDateField',
    required_params: ['date_format'],
    host_field: 'field',
    start_hook: this.start,
  });
}

util.inherits(FilterComputeDateField, base_filter.BaseFilter);

FilterComputeDateField.prototype.start = function(callback) {
  logger.info('Initialized compute date field filter on field: ' + this.field + ', date_format: ' + this.date_format);
  callback();
};

FilterComputeDateField.prototype.process = function(data) {
  if (data['@timestamp']) {
    data[this.field] = moment(data['@timestamp']).format(this.date_format);
  }
  return data;
};

exports.create = function() {
  return new FilterComputeDateField();
};
