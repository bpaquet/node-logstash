var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterMutateReplace() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'MutateReplace',
    host_field: 'field',
    required_params: ['from', 'to'],
    start_hook: this.start,
  });
}

util.inherits(FilterMutateReplace, base_filter.BaseFilter);

FilterMutateReplace.prototype.start = function(callback) {
  this.regex = new RegExp(this.from, 'g');
  logger.info('Initialized mutate gsub filter on field: ' + this.field + ', from: ' + this.from + ', to: ' + this.to);
  callback();
};

FilterMutateReplace.prototype.process = function(data) {
  if (data[this.field]) {
    logger.debug('Gsub on field', this.field, ', from', this.from, ', to', this.to, ', current value', data[this.field]);
    data[this.field] = data[this.field].toString().replace(this.regex, this.to);
    logger.debug('New value', data[this.field]);
  }
  return data;
};

exports.create = function() {
  return new FilterMutateReplace();
};
