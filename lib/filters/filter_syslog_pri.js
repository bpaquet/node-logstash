/* jshint bitwise:false */

var base_filter = require('../lib/base_filter'),
  util = require('util');

function FilterSyslogPri() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'SyslogPri',
    optional_params: ['priority_field', 'severity_field', 'facility_field'],
    default_values: {
      'priority_field': 'syslog_priority',
      'severity_field': 'syslog_severity',
      'facility_field': 'syslog_facility',
    }
  });
}

var facility_labels = [
  'kernel',
  'user-level',
  'mail',
  'daemon',
  'security/authorization',
  'syslogd',
  'line printer',
  'network news',
  'uucp',
  'clock',
  'security/authorization',
  'ftp',
  'ntp',
  'log audit',
  'log alert',
  'clock',
  'local0',
  'local1',
  'local2',
  'local3',
  'local4',
  'local5',
  'local6',
  'local7',
];

var severity_labels = [
  'emergency',
  'alert',
  'critical',
  'error',
  'warning',
  'notice',
  'informational',
  'debug',
];

util.inherits(FilterSyslogPri, base_filter.BaseFilter);

FilterSyslogPri.prototype.process = function(data) {
  if (data[this.priority_field] > -1 && data[this.priority_field] < 192) {
    var priority = data[this.priority_field];
    var severity = priority & 7;
    var facility = priority >> 3;
    data[this.severity_field] = severity_labels[severity];
    data[this.facility_field] = facility_labels[facility];
  }
  return data;
};

exports.create = function() {
  return new FilterSyslogPri();
};
