var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node'),
    patterns_loader = require('../lib/patterns_loader'),
    moment = require('moment');

function FilterRegex() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'Regex',
    host_field: 'pattern_field',
    allow_empty_host: true,
    optional_params: ['regex', 'fields', 'date_format']
  }
}

util.inherits(FilterRegex, base_filter.BaseFilter);

FilterRegex.prototype.extendedLoadConfig = function(callback) {
  if (this.pattern_field) {
    logger.info('Try to load config from pattern file ' + this.pattern_field);
    patterns_loader.load(this.pattern_field, function(err, config) {
      if (err) {
        return callback(new Error('Unable to load pattern : ' + this.pattern_field + ' : ' + err));
      }
      for(var i in config) {
        this[i] = config[i];
      }
      callback();
    }.bind(this));
  }
  else {
    callback();
  }
}

FilterRegex.prototype.afterLoadConfig = function(callback) {
  this.regex = new RegExp(this.regex);
  this.date_format = this.date_format;

  this.fields = this.fields.split(',');

  logger.info('Initializing regex filter, regex : ' + this.regex + ', fields ' + this.fields + (this.date_format ? ', date format ' + this.date_format : ''));

  callback();
}

FilterRegex.prototype.process = function(data) {
  logger.debug('Trying to match on regex', this.regex, ', input', data['@message']);
  var result = data['@message'].match(this.regex);
  logger.debug('Match result:', result);
  if (result) {
    if (!data['@fields']) {
      data['@fields'] = {};
    }
    for(var i = 0; i < this.fields.length; i ++) {
      var v = result[i + 1];
      if (v) {
        if (this.date_format && this.fields[i] == 'timestamp') {
          data['@timestamp'] = moment(v, this.date_format).format();
          logger.debug('Event timestamp modified to', data['@timestamp']);
        }
        else {
          if (v.match(/^[0-9]+$/)) {
            v = parseInt(v);
          }
          else if (v.match(/^[0-9]+[\.,][0-9]+$/)) {
            v = parseFloat(v.replace(',', '.'));
          }
          data['@fields'][this.fields[i]] = v;
        }
      }
    }
  }
}

exports.create = function() {
  return new FilterRegex();
}