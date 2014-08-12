var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterGrep() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Grep',
    required_params: ['regex'],
    optional_params: ['invert', 'regex_flags'],
    default_values: {
      'invert': false,
    },
    start_hook: this.start,
  });
}

util.inherits(FilterGrep, base_filter.BaseFilter);

FilterGrep.prototype.start = function(callback) {
  this.regex = new RegExp(this.regex, this.regex_flags);
  logger.info('Initialized grep filter on regex: ' + this.regex + ', invert: ' + this.invert + ', flags: ' + (this.regex_flags || ''));
  callback();
};

FilterGrep.prototype.process = function(data) {
  var match = data.message.match(this.regex);
  if (this.invert) {
    match = !match;
  }
  return match ? data : undefined;
};

exports.create = function() {
  return new FilterGrep();
};
