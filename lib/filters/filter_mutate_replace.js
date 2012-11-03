var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterMutateReplace() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'MutateReplace',
    required_params: ['from', 'to'],
    host_field: 'field_name',
  }
}

util.inherits(FilterMutateReplace, base_filter.BaseFilter);

FilterMutateReplace.prototype.afterLoadConfig = function(callback) {
  this.regex = new RegExp(this.from, 'g');
  logger.info('Initialized mutate gsub filter on field: ' + this.field_name + ', from: ' + this.from + ', to: ' + this.to);
  callback();
}

FilterMutateReplace.prototype.process = function(data) {
  if (data.getField(this.field_name)) {
    logger.debug('Gsub on field', this.field_name, ', from', this.from, ', to', this.to, ', current value', data.getField(this.field_name));
    data.setField(this.field_name, data.getField(this.field_name).replace(this.regex, this.to));
    logger.debug('New value', data.getField(this.field_name));
  }
  return data;
}

exports.create = function() {
  return new FilterMutateReplace();
}
