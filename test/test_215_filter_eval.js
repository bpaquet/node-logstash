var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter eval ').addBatch({
  'multiplication': filter_helper.create('eval', 'message?operation=x*1000', [
    {
      'message': 'abcd',
      'toto': 'z'
    },
    {
      'message': '10'
    },
    {
      'message': 4
    },
  ], [
    {
      'message': 'abcd',
      'toto': 'z'
    },
    {
      'message': 10000
    },
    {
      'message': 4000
    },
  ]),
  'divide by 0': filter_helper.create('eval', 'message?operation=x/0', [
    {
      'message': 'abcd',
    },
    {
      'message': 4
    },
  ], [
    {
      'message': 'abcd',
    },
    {
      'message': 4
    },
  ]),
  'target_field': filter_helper.create('eval', 'message?operation=x*10&target_field=toto', [
    {
      'message': 4,
    },
  ], [
    {
      'message': 4,
      'toto': 40
    },
  ]),
  'not compile': filter_helper.create('eval', 'message?operation=x%20x', [
    {
      'message': 'abcd',
    },
    {
      'message': 4
    },
  ], [
    {
      'message': 'abcd',
    },
    {
      'message': 4
    },
  ]),
  'not using x, result integer': filter_helper.create('eval', 'message?operation=5', [
    {
      'message': 'abcd',
    },
  ], [
    {
      'message': 5
    },
  ]),
  'not using x, result string': filter_helper.create('eval', 'message?operation=%22azert%22', [
    {
      'message': 'abcd',
    },
  ], [
    {
      'message': 'azert'
    },
  ]),
  'string lowercase': filter_helper.create('eval', 'message?operation=x.toLowerCase()', [
    {
      'message': 'aBCD',
    },
  ], [
    {
      'message': 'abcd'
    },
  ]),
  'string concat': filter_helper.create('eval', 'message?operation=x+"a"', [
    {
      'message': 'aBCD',
    },
  ], [
    {
      'message': 'aBCDa'
    },
  ]),
  'null': filter_helper.create('eval', 'message?operation=null', [
    {
      'message': 'aBCD',
    },
  ], [
    {
      'message': 'aBCD'
    },
  ]),
  'undefined': filter_helper.create('eval', 'message?operation=undefined', [
    {
      'message': 'aBCD',
    },
  ], [
    {
      'message': 'aBCD'
    },
  ]),
}).export(module);
