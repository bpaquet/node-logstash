var base_filter = require('../lib/base_filter'),
  util = require('util'),
  logger = require('log4node'),
  patterns_loader = require('../lib/patterns_loader'),
  regex_helper = require('../lib/regex_helper');

function FilterRegex() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig(regex_helper.config());
  this.mergeConfig({
    name: 'Regex',
    host_field: 'pattern_field',
    allow_empty_host: true,
    required_params: ['regex'],
    optional_params: ['fields', 'regex_flags'],
    default_values: {
      'fields': '',
      'numerical_fields': '',
    },
    config_hook: this.loadPattern,
    start_hook: this.start,
  });
}

util.inherits(FilterRegex, base_filter.BaseFilter);

FilterRegex.prototype.loadPattern = function(callback) {
  if (this.pattern_field) {
    logger.info('Try to load config from pattern file ' + this.pattern_field);
    patterns_loader.load(this.pattern_field, function(err, config) {
      if (err) {
        return callback(new Error('Unable to load pattern : ' + this.pattern_field + ' : ' + err));
      }
      for (var i in config) {
        this[i] = config[i];
      }
      callback();
    }.bind(this));
  }
  else {
    callback();
  }
};

FilterRegex.prototype.start = function(callback) {
  this.regex = new RegExp(this.regex, this.regex_flags);

  this.fields = this.fields.split(',');

  this.post_process = regex_helper.process.bind(this);

  logger.info('Initializing regex filter, regex : ' + this.regex + ', fields ' + this.fields + (this.date_format ? ', date format ' + this.date_format : '') + ', flags: ' + (this.regex_flags || ''));

  callback();
};

FilterRegex.prototype.process = function(data) {
  logger.debug('Trying to match on regex', this.regex, ', input', data.message);
  var result = data.message.match(this.regex);
  logger.debug('Match result:', result);
  if (result) {
    for (var i = 0; i < this.fields.length; i++) {
      this.post_process(data, result[i + 1], i);
    }
  }
  return data;
};

exports.create = function() {
  return new FilterRegex();
};
