var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterHttpStatusClassifier() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'HttpStatus',
    host_field: 'field_name',
    optional_params: ['special_codes', 'target_field'],
    default_values: {
      target_field: 'http_class',
    },
    start_hook: this.start,
  });
}

util.inherits(FilterHttpStatusClassifier, base_filter.BaseFilter);

FilterHttpStatusClassifier.prototype.start = function(callback) {
  if (this.special_codes) {
    this.special_codes = this.special_codes.split(/,/).map(function(x) {
      return parseInt(x, 10);
    });
  }
  else {
    this.special_codes = [];
  }
  logger.info('Initialized http status filter: source ' + this.field_name + ', target: ' + this.target_field + ', special_codes: ' + this.special_codes);
  callback();
};

FilterHttpStatusClassifier.prototype.process = function(data) {
  if (data[this.field_name]) {
    for(var i in this.special_codes) {
      if (data[this.field_name] === this.special_codes[i]) {
        data[this.target_field] = this.special_codes[i].toString();
        return data;
      }
    }
    if (data[this.field_name] >= 100 && data[this.field_name] < 200) {
      data[this.target_field] = '1xx';
    }
    if (data[this.field_name] >= 200 && data[this.field_name] < 300) {
      data[this.target_field] = '2xx';
    }
    if (data[this.field_name] >= 300 && data[this.field_name] < 400) {
      data[this.target_field] = '3xx';
    }
    if (data[this.field_name] >= 400 && data[this.field_name] < 500) {
      data[this.target_field] = '4xx';
    }
    if (data[this.field_name] >= 500 && data[this.field_name] < 600) {
      data[this.target_field] = '5xx';
    }
  }
  return data;
};

exports.create = function() {
  return new FilterHttpStatusClassifier();
};
