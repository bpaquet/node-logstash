var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter truncate msg ').addBatch({
  
  /*'normal': filter_helper.create('compute_field', 'titi?value=ab', [
    {
      'message': 'toto'
    },
  ], [
    {
      'message': 'toto',
      'titi': 'ab'
    },
  ]),
  'with value': filter_helper.create('compute_field', 'titi?value=ab#{bouh}', [
    {
      'message': 'toto',
      'bouh': 'tata'
    },
    {
      'message': 'toto',
      'bouh': 42
    },
    {
      'message': 'toto',
      'bouh': 42,
      'titi': 'abcdef'
    },
    {
      'message': 'toto'
    },
  ], [
    {
      'message': 'toto',
      'bouh': 'tata',
      'titi': 'abtata'
    },
    {
      'message': 'toto',
      'bouh': 42,
      'titi': 'ab42'
    },
    {
      'message': 'toto',
      'bouh': 42,
      'titi': 'ab42'
    },
    {
      'message': 'toto'
    },
  ]),*/
}).export(module);
