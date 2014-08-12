var base_filter = require('../lib/base_filter'),
  util = require('util'),
  dns = require('dns'),
  logger = require('log4node');

function FilterReverseDns() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'ReverseDns',
    optional_params: ['only_hostname', 'target_field'],
    host_field: 'field_name',
    default_values: {
      'only_hostname': 'true',
    },
    start_hook: this.start,
  });
}

util.inherits(FilterReverseDns, base_filter.BaseFilter);

FilterReverseDns.prototype.start = function(callback) {
  this.only_hostname = this.only_hostname === 'true';
  if (!this.target_field) {
    this.target_field = this.field_name;
  }
  logger.info('Initialized reverse dns filter, use only hostname ', this.only_hostname);
  callback();
};

FilterReverseDns.prototype.process = function(data) {
  if (data[this.field_name]) {
    try {
      dns.reverse(data[this.field_name], function(err, result) {
        if (!err) {
          data[this.target_field] = result[0];
          if (this.only_hostname) {
            data[this.target_field] = data[this.target_field].split('.')[0];
          }
        }
        this.emit('output', data);
      }.bind(this));
    }
    catch (err) {
      return data;
    }
  }
  else {
    return data;
  }
};

exports.create = function() {
  return new FilterReverseDns();
};
