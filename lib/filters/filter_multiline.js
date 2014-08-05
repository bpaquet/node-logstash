var base_filter_buffer = require('../lib/base_filter_buffer'),
  util = require('util'),
  logger = require('log4node');

function FilterMultiline() {
  base_filter_buffer.BaseFilterBuffer.call(this);
  this.mergeConfig({
    name: 'Multiline',
    required_params: ['start_line_regex'],
    optional_params: ['max_delay', 'regex_flags'],
    default_values: {
      max_delay: 50,
    },
    start_hook: this.start,
  });
}

util.inherits(FilterMultiline, base_filter_buffer.BaseFilterBuffer);

FilterMultiline.prototype.start = function(callback) {
  this.start_line_regex = new RegExp(this.start_line_regex, this.regex_flags);
  logger.info('Initialized multiline filter with start_line_regex: ' + this.start_line_regex + ', flags: ' + (this.regex_flags || ''));
  this.setInterval(this.max_delay);
  callback();
};

FilterMultiline.prototype.process = function(data) {
  var key = this.computeKey(data);
  if (data.message.match(this.start_line_regex)) {
    this.sendIfNeeded(key);
  }
  this.store(key, data);
};

exports.create = function() {
  return new FilterMultiline();
};
