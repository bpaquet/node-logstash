var logger = require('log4node'),
moment = require('moment');

exports.config = function() {
  return {
    optional_params: ['numerical_fields', 'date_format'],
    default_values: {
      'fields': '',
      'numerical_fields': '',
    },
    start_hook: function(callback) {
      this.numerical_fields = this.numerical_fields.split(',');
      callback();
    },
  };
};

exports.process = function(data, v, i) {
  if (v !== undefined && v !== null && v !== '') {
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
      if (v.match(/^[0-9]+$/)) {
        v = parseInt(v, 10);
      }
      else if (v.match(/^[0-9]+[\.,][0-9]+$/)) {
        v = parseFloat(v.replace(',', '.'));
      }
      else {
        if (this.numerical_fields.indexOf(this.fields[i]) !== -1) {
          v = undefined;
        }
      }
      if (v !== undefined) {
        data[this.fields[i]] = v;
      }
    }
  }
};