var vows = require('vows'),
    assert = require('assert'),
    filter_helper = require('./filter_helper');

vows.describe('Filter compute date field ').addBatch({
  'normal': filter_helper.create('compute_date_field', 'titi?date_format=DD/MMMM/YYYY HH', [
    {},
    {'@timestamp': '2012-07-31T18:02:28.123+02:00'},
    {'@timestamp': '2012-07-31T18:02:28.123+01:00', '@fields': {'tata': 'a'}},
  ], [
    {},
    {'@timestamp': '2012-07-31T18:02:28.123+02:00', '@fields': {'titi': '31/July/2012 16'}},
    {'@timestamp': '2012-07-31T18:02:28.123+01:00', '@fields': {'tata': 'a', 'titi': '31/July/2012 17'}}
  ]),
}).export(module);