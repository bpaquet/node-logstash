var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter syslog pri').addBatch({
  'normal': filter_helper.create('syslog_pri', '?', [
    {
      'message': 'abcc'
    },
    {
      'message': 'abcc',
      'c': 12
    },
    {
      'message': 'abcc',
      'syslog_priority': 'a'
    },
    {
      'message': 'abcc',
      'syslog_priority': 158
    },
    {
      'message': 'abcc',
      'syslog_priority': 0
    },
    {
      'message': 'abcc',
      'syslog_priority': 191
    },

  ], [
    {
      'message': 'abcc'
    },
    {
      'message': 'abcc',
      'c': 12
    },
    {
      'message': 'abcc',
      'syslog_priority': 'a'
    },
    {
      'message': 'abcc',
      'syslog_priority': 158,
      'syslog_facility': 'local3',
      'syslog_severity': 'informational'
    },
    {
      'message': 'abcc',
      'syslog_priority': 0,
      'syslog_facility': 'kernel',
      'syslog_severity': 'emergency'
    },
    {
      'message': 'abcc',
      'syslog_priority': 191,
      'syslog_facility': 'local7',
      'syslog_severity': 'debug'
    },
  ]),
}).export(module);
