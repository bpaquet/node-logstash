var base_filter = require('../lib/base_filter'),
    url = require('url'),
    util = require('util'),
    logger = require('log4node'),
    patterns_loader = require('../lib/patterns_loader'),
    moment = require('moment');

function FilterIRegex() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'iRegex',
    host_field: 'pattern_field',
    allow_empty_host: true,
    required_params: ['regex'],
    optional_params: [, 'fields', 'numerical_fields', 'request_fields', 'date_format'],
    default_values: {
      'fields': '',
      'numerical_fields': '',
      'request_fields': '',
    }
  }
}

util.inherits(FilterIRegex, base_filter.BaseFilter);

FilterIRegex.prototype.extendedLoadConfig = function(callback) {
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

FilterIRegex.prototype.afterLoadConfig = function(callback) {
  this.regex = new RegExp(this.regex);
  this.date_format = this.date_format;

  this.fields = this.fields.split(',');
  this.numerical_fields = this.numerical_fields.split(',');

  logger.info('Initializing regex filter, regex : ' + this.regex + ', fields ' + this.fields + (this.date_format ? ', date format ' + this.date_format : ''));

  callback();
}

FilterIRegex.prototype.checkValue = function(v, key){
    if (v.match(/^[0-9]+$/)) {
  	v = parseInt(v);
	}
	else if (v.match(/^[0-9]+[\.,][0-9]+$/)) {
		v = parseFloat(v.replace(',', '.'));
	}
	else {
		if (key && this.numerical_fields.indexOf(key) != -1) {
			v = undefined;
		}
	}
	return v;
}


FilterIRegex.prototype.process = function(data) {
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
				if (this.date_format && (this.fields[i] == 'timestamp' || this.fields[i] == '@timestamp')) {
					data['@timestamp'] = v;
					logger.debug('Event timestamp modified to', data['@timestamp']);
				}
				else if (this.fields[i] == '@source_host') {
					data['@source_host'] = v;
				}
				else if (this.fields[i] == '@message') {
					data['@message'] = v;
				}
				else {
					if (this.request_fields.indexOf(this.fields[i]) != -1){
						var url_parts = this.url.parse(v, true);
						for (var attrname in url_parts.query) {
							v = checkValue(v);
							data['@fields'][attrname] = url_parts.query[attrname];
						}
					}
					v = checkValue(v, this.fields[i]);


					if (v !== undefined) {
						data['@fields'][this.fields[i]] = v;
					}
				}
			}
		}
	}
	return data;
}

exports.create = function() {
  return new FilterIRegex();
}
