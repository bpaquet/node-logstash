var base_filter = require('../lib/base_filter'),
  url = require('url'),
  util = require('util'),
  logger = require('log4node'),
  patterns_loader = require('../lib/patterns_loader'),
  moment = require('moment');

function FilterRegexUrl() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Regex',
    host_field: 'pattern_field',
    allow_empty_host: true,
    required_params: ['regex'],
    optional_params: ['fields', 'numerical_fields', 'request_fields', 'request_fields_list', 'date_format', 'regex_flags', 'request_prefix'],
    default_values: {
      'fields': '',
      'numerical_fields': '',
	  'request_fields': '',
	  'request_fields_list': '',
	  'request_prefix': '',
    },
    config_hook: this.loadPattern,
    start_hook: this.start,
  });
}

util.inherits(FilterRegexUrl, base_filter.BaseFilter);

FilterRegexUrl.prototype.loadPattern = function(callback) {
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

FilterRegexUrl.prototype.start = function(callback) {
  this.regex = new RegExp(this.regex, this.regex_flags);
  this.date_format = this.date_format;

  this.fields = this.fields.split(',');
  this.numerical_fields = this.numerical_fields.split(',');
  this.request_fields = this.request_fields.split(',');
  if (this.request_fields_list){
	this.request_fields_list = this.request_fields_list.split(',');
  }

  logger.info('Initializing regex_url filter, regex : ' + this.regex + ', fields ' + this.fields + (this.date_format ? ', date format ' + this.date_format : '') + ', flags: ' + (this.regex_flags || '') + ', request_fields: ' + this.request_fields + ', request_fields_list: ' + this.request_fields_list);

  callback();
};

FilterRegexUrl.prototype.checkValue = function(v, key){
	if (v.match(/^[0-9]+$/)) {
		v = parseInt(v);
	}
	else if (v.match(/^[0-9]+[\.,][0-9]+$/)) {
		v = parseFloat(v.replace(',', '.'));
	}
	else {
		if (key && this.numerical_fields.indexOf(key) !== -1) {
			v = undefined;
		}
	}
	return v;
};


FilterRegexUrl.prototype.process = function(data) {
  logger.debug('Trying to match on regex', this.regex, ', input', data.message);
  var result = data.message.match(this.regex);
  logger.debug('Match result:', result);
  if (result) {
    for (var i = 0; i < this.fields.length; i++) {
      var v = result[i + 1];
      if (v) {
        if (this.date_format && (this.fields[i] === 'timestamp' || this.fields[i] === '@timestamp')) {
          var m = moment(v, this.date_format);
          if (m.year() + m.month() + m.date() + m.hours() + m.minutes() + m.seconds() > 1) {
            if (m.year() === 0) {
              m.year(moment().year());
            }
            data['@timestamp'] = m.format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
            logger.debug('Event timestamp modified to', data['@timestamp']);
          }
        }
        else if (this.fields[i] === 'host') {
          data.host = v;
        }
        else if (this.fields[i] === 'message') {
          data.message = v;
        }
        else {
	      if (this.request_fields.indexOf(this.fields[i]) !== -1){
		    try {
		      var url_parts = url.parse(v, true);
			  for (var attrname in url_parts.query) {
			    if (!this.request_fields_list || this.request_fields_list.indexOf(attrname) !== -1){
				  v = this.checkValue(v);
				  data[this.request_prefix+attrname] = url_parts.query[attrname];
				}
			  }
		    }
		    catch (err){
			    // we just do nothing here as we couldn't parse the url
		    }
	      }
	      v = this.checkValue(v, this.fields[i]);
        }
        if (v !== undefined) {
          data[this.fields[i]] = v;
        }
      }
    }
  }
  return data;
};

exports.create = function() {
  return new FilterRegexUrl();
};
