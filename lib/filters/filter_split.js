var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node');

function FilterSplit() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Split',
    required_params: ['delimiter'],
    start_hook: this.start,
  });
}

util.inherits(FilterSplit, base_filter.BaseFilter);

FilterSplit.prototype.start = function(callback) {
  logger.info('Initialized split filter with delimiter: ' + this.delimiter);
  callback();
};

FilterSplit.prototype.createMessage = function(data, text) {
  var m = JSON.parse(JSON.stringify(data));
  m.message = text;
  return m;
};

FilterSplit.prototype.process = function(data) {
  var result = [];
  var current = data.message;
  while (true) {
    var index = current.indexOf(this.delimiter);
    if (index === -1) {
      break;
    }
    var before = current.substring(0, index);
    current = current.substring(index + this.delimiter.length);
    if (before.length > 0) {
      result.push(this.createMessage(data, before));
    }
  }
  if (current.length > 0) {
    result.push(this.createMessage(data, current));
  }
  return result;
};

exports.create = function() {
  return new FilterSplit();
};
