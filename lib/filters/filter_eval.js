var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterComputeField() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Eval',
    required_params: ['operation'],
    optional_params: ['target_field'],
    host_field: 'source_field',
    start_hook: this.start,
  });
}

util.inherits(FilterComputeField, base_filter.BaseFilter);

FilterComputeField.prototype.start = function(callback) {
  if (!this.target_field) {
    this.target_field = this.source_field;
  }
  logger.info('Initializing eval filter from', this.source_field, 'to', this.target_field, 'operation', this.operation);
  callback();
};

FilterComputeField.prototype.process = function(data) {
  var x = data[this.source_field];
  if (x) {
    try {
      /* jshint evil: true */
      var result = eval(this.operation);
      if (result !== undefined && result !== null && (typeof result === 'string' || ! isNaN(result)) && result !== Infinity) {
        data[this.target_field] = result;
      }
    }
    catch(err) {
    }
  }
  return data;
};

exports.create = function() {
  return new FilterComputeField();
};
