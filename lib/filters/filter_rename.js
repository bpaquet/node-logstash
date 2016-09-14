var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterRenameField() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'RenameField',
    required_params: ['to'],
    host_field: 'from',
    start_hook: this.start,
  });
}

util.inherits(FilterRenameField, base_filter.BaseFilter);

FilterRenameField.prototype.start = function(callback) {
  logger.info('Initialized rename field filter from ' + this.from + ' to ' + this.to);
  callback();
};

FilterRenameField.prototype.process = function(data) {
  if (data[this.from]) {
    data[this.to] = data[this.from];
    delete data[this.from];
  }
  return data;
};

exports.create = function() {
  return new FilterRenameField();
};
