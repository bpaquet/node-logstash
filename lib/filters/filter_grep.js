var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterGrep() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'Grep',
    required_params: ['regex'],
    optional_params: ['invert'],
    default_values: {
      'invert': 'false',
    }
  }
}

util.inherits(FilterGrep, base_filter.BaseFilter);

FilterGrep.prototype.afterLoadConfig = function(callback) {
  this.regex = new RegExp(this.regex);
  this.invert = this.invert == 'true';
  logger.info('Initialized grep filter on regex: ' + this.regex + ', invert: ' + this.invert);
  callback();
}

FilterGrep.prototype.process = function(data) {
  var match = data['@message'].match(this.regex);
  if (this.invert) {
    match = ! match;
  }
  return match ? data : undefined;
}

exports.create = function() {
  return new FilterGrep();
}
