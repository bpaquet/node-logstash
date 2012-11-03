var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterSplit() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'Split',
    required_params: ['delimiter'],
  }
}

util.inherits(FilterSplit, base_filter.BaseFilter);

FilterSplit.prototype.afterLoadConfig = function(callback) {
  logger.info('Initialized split filter with delimiter: ' + this.delimiter);
  callback();
}

FilterSplit.prototype.createMessage = function(data, text) {
  var m = data.clone();
  m.setMessage(text);
  return m;
}

FilterSplit.prototype.process = function(data) {
  var result = [];
  var current = data.getMessage();
  while(true) {
    var index = current.indexOf(this.delimiter);
    if (index == -1) {
      break;
    }
    var before = current.substring(0, index);
    var current = current.substring(index + this.delimiter.length);
    if (before.length > 0) {
      result.push(this.createMessage(data, before));
    }
  }
  if (current.length > 0) {
    result.push(this.createMessage(data, current));
  }
  return result;
}

exports.create = function() {
  return new FilterSplit();
}
