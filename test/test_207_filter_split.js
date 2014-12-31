var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter split ').addBatch({
  'normal': filter_helper.create('split', '?delimiter=|', [
    {
      'message': 'toto||tata|titi',
      'host': 'a'
    },
    {
      'message': 'tete|bouh|',
      'host': 'b'
    },
  ], [
    {
      'message': 'toto',
      'host': 'a'
    },
    {
      'message': 'tata',
      'host': 'a'
    },
    {
      'message': 'titi',
      'host': 'a'
    },
    {
      'message': 'tete',
      'host': 'b'
    },
    {
      'message': 'bouh',
      'host': 'b'
    },
  ]),
  'normal with fields and long delimiter': filter_helper.create('split', '?delimiter=|()', [
    {
      'message': 'toto|()tata|()|()titi',
      'host': 'a',
      'z': 2
    },
  ], [
    {
      'message': 'toto',
      'host': 'a',
      'z': 2
    },
    {
      'message': 'tata',
      'host': 'a',
      'z': 2
    },
    {
      'message': 'titi',
      'host': 'a',
      'z': 2
    },
  ]),
  'with carring return in regex': filter_helper.create('split', '?delimiter=toto%0Atiti', [
    {
      'message': 'l1 toto\ntitil2 toto\ntitil3 toto\ntitil4',
    },
  ], [
    {
      'message': 'l1 ',
    },
    {
      'message': 'l2 ',
    },
    {
      'message': 'l3 ',
    },
    {
      'message': 'l4',
    },
  ]),
}).export(module);
