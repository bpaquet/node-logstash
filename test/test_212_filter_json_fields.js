var vows = require('vows'),
  patterns_loader = require('lib/patterns_loader'),
  filter_helper = require('./filter_helper');

patterns_loader.add('/toto');
patterns_loader.add('/tata');
patterns_loader.add('../lib/patterns');

vows.describe('Filter json_fields ').addBatch({
  'basic': filter_helper.create('json_fields', '', [
    {
      'message': '{"abcd":"efgh","ijk":["l","m","n"]}'
    },
    {
      'message': '{"abcd":"ef\\"\\ngh","ijk":["l","m","n"]}'
    },
  ], [
    {
      'message': '{"abcd":"efgh","ijk":["l","m","n"]}',
      abcd: 'efgh',
      ijk: ['l', 'm', 'n']
    },
    {
      'message': '{"abcd":"ef\\"\\ngh","ijk":["l","m","n"]}',
      abcd: 'ef\"\ngh',
      ijk: ['l', 'm', 'n']
    },
  ]),
  'empty': filter_helper.create('json_fields', '', [
    {
      'message': '{}'
    },
  ], [
    {
      'message': '{}'
    },
  ]),
  'merge': filter_helper.create('json_fields', '', [
    {
      'message': '{"abcd":"efgh","ijk":["l","m","n"]}',
      fc: 'toto'
    },
  ], [
    {
      'message': '{"abcd":"efgh","ijk":["l","m","n"]}',
      fc: 'toto',
      abcd: 'efgh',
      ijk: ['l', 'm', 'n']
    },
  ]),
  'overwrite': filter_helper.create('json_fields', '', [
    {
      'message': '{"abcd":"efgh","ijk":["l","m","n"]}',
      fc: 'toto',
      abcd: 'toto'
    },
  ], [
    {
      'message': '{"abcd":"efgh","ijk":["l","m","n"]}',
      fc: 'toto',
      abcd: 'efgh',
      ijk: ['l', 'm', 'n']
    },
  ]),
  'numeric': filter_helper.create('json_fields', '', [
    {
      'message': '{"abcd":0,"ijk":[1,2,3]}'
    },
  ], [
    {
      'message': '{"abcd":0,"ijk":[1,2,3]}',
      abcd: 0,
      ijk: [1, 2, 3]
    },
  ]),
  'object': filter_helper.create('json_fields', '', [
    {
      'message': '{"abcd":{"ef":"g","h":0},"ijk":[1,2,-3.5e-2]}'
    },
  ], [
    {
      'message': '{"abcd":{"ef":"g","h":0},"ijk":[1,2,-3.5e-2]}',
      abcd: {
        ef: 'g',
        h: 0
      },
      ijk: [1, 2, -0.035]
    },
  ]),
  'boolean': filter_helper.create('json_fields', '', [
    {
      'message': '{"abcd":true,"efg":false}'
    },
  ], [
    {
      'message': '{"abcd":true,"efg":false}',
      abcd: true,
      efg: false
    },
  ]),
  'null': filter_helper.create('json_fields', '', [
    {
      'message': '{"abcd":null}'
    },
  ], [
    {
      'message': '{"abcd":null}',
      abcd: null
    },
  ]),
  'corner_cases': filter_helper.create('json_fields', '', [
    {
      'message': ''
    },
    {
      'message': '{'
    },
    {
      'message': '{[]'
    },
    {
      'message': '<123>{"abc":"efg"}'
    },
    {
      'message': '<123>[}'
    },
    {
      'message': '<123>[]'
    },
  ], [
    {
      'message': ''
    },
    {
      'message': '{'
    },
    {
      'message': '{[]'
    },
    {
      'message': '<123>{"abc":"efg"}',
      abc: 'efg'
    },
    {
      'message': '<123>[}'
    },
    {
      'message': '<123>[]'
    },
  ]),
}).export(module);
