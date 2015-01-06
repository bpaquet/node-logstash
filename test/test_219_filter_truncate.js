var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter truncate ').addBatch({
  'normal': filter_helper.create('truncate', '?max_size=3', [
    {
      'message': 'toto'
    },
    {
      'message': 't'
    },
  ], [
    {
      'message': 'tot',
    },
    {
      'message': 't',
    },
  ]),
}).export(module);
