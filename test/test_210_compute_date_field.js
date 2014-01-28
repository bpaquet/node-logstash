var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter compute date field ').addBatch({
  'normal': filter_helper.create('compute_date_field', 'titi?date_format=DD/MMMM/YYYY HH', [
    {},
    {
      '@timestamp': '2012-07-31T18:02:28.123+02:00'
    },
  ], [
    {},
    {
      '@timestamp': '2012-07-31T18:02:28.123+02:00',
      'titi': '31/July/2012 16'
    },
  ]),
}).export(module);
