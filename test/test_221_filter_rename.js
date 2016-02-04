var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter rename ').addBatch({
  'normal': filter_helper.create('rename', 'message?to=m', [
    {
      'message': 'toto'
    },
    {
      'message2': 't'
    },
  ], [
    {
      'm': 'toto',
    },
    {
      'message2': 't',
    },
  ]),
}).export(module);
