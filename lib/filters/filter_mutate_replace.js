var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterMutateReplace() {
  base_filter.BaseFilter.call(this);
  this.merge_config({
    name: 'MutateReplace',
    host_field: 'field_name',
    required_params: ['from', 'to'],
  });
}

util.inherits(FilterMutateReplace, base_filter.BaseFilter);

FilterMutateReplace.prototype.afterLoadConfig = function(callback) {
  this.regex = new RegExp(this.from, 'g');
  logger.info('Initialized mutate gsub filter on field: ' + this.field_name + ', from: ' + this.from + ', to: ' + this.to);
  callback();
};

FilterMutateReplace.prototype.process = function(data) {
  if (data[this.field_name]) {
    logger.debug('Gsub on field', this.field_name, ', from', this.from, ', to', this.to, ', current value', data[this.field_name]);
    data[this.field_name] = data[this.field_name].toString().replace(this.regex, this.to);
    logger.debug('New value', data[this.field_name]);
  }
  return data;
};

exports.create = function() {
  return new FilterMutateReplace();
};
