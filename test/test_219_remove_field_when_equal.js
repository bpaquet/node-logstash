var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter remove field when equal').addBatch({
  'normal': filter_helper.create('remove_field_when_equal', 'request_id?value=-', [
    {
      'message': 'a',
      'request_id': 'b',
    },
    {
      'message': 'b',
      'request_id': '-',
    },
    {
      'message': 'c',
    },
  ], [
    {
      'message': 'a',
      'request_id': 'b',
    },
    {
      'message': 'b',
    },
    {
      'message': 'c',
    },
  ]),
}).export(module);
