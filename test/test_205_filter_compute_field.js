var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter compute field ').addBatch({
  'normal': filter_helper.create('compute_field', 'titi?value=ab', [
    {
      'message': 'toto'
    },
  ], [
    {
      'message': 'toto',
      'titi': 'ab'
    },
  ]),
  'edge1': filter_helper.create('compute_field', 'titi?value=#{bouh}', [
    {
      'message': 'toto',
      'bouh': 'a'
    },
  ], [
    {
      'message': 'toto',
      'bouh': 'a',
      'titi': 'a'
    },
  ]),
  'edge2': filter_helper.create('compute_field', 'titi?value=#{}', [
    {
      'message': 'toto',
      'bouh': 'a'
    },
  ], [
    {
      'message': 'toto',
      'bouh': 'a'
    },
  ]),
  'edge3': filter_helper.create('compute_field', 'titi?value=#{', [
    {
      'message': 'toto',
      'bouh': 'a'
    },
  ], [
    {
      'message': 'toto',
      'bouh': 'a',
      'titi': '#{'
    },
  ]),
  'with value': filter_helper.create('compute_field', 'titi?value=ab#{bouh}z', [
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
      'titi': 'abtataz'
    },
    {
      'message': 'toto',
      'bouh': 42,
      'titi': 'ab42z'
    },
    {
      'message': 'toto',
      'bouh': 42,
      'titi': 'ab42z'
    },
    {
      'message': 'toto'
    },
  ]),
  'with multiple values': filter_helper.create('compute_field', 'titi?value=#{bouh1}_#{bouh2}_#{bouh3}', [
    {
      'message': 'toto',
      'bouh1': 'tata',
      'bouh2': '22',
      'bouh3': 34,
    },
    {
      'message': 'titi',
      'bouh1': 'tata2',
      'bouh2': '29',
      'bouh3': 9.7,
    },
    {
      'message': 'titi',
      'bouh1': 'tata2',
    },
  ], [
    {
      'message': 'toto',
      'bouh1': 'tata',
      'bouh2': '22',
      'bouh3': 34,
      'titi': 'tata_22_34',
    },
    {
      'message': 'titi',
      'bouh1': 'tata2',
      'bouh2': '29',
      'bouh3': 9.7,
      'titi': 'tata2_29_9.7'
    },
    {
      'message': 'titi',
      'bouh1': 'tata2',
    },
  ]),
  'date': filter_helper.create('compute_field', 'titi?value=#{now:YYYY/MM}', [
    {
      'message': 'toto',
    },
  ], [
    {
      'message': 'toto',
      'titi': require('moment')().format('YYYY/MM'),
    },
  ]),
}).export(module);
