var vows = require('vows'),
    assert = require('assert'),
    filter_helper = require('./filter_helper');

vows.describe('Filter grep ').addBatch({
  'normal': filter_helper.create('grep', '?regex=abc', [
    {'@message': 'abcd'},
    {'@message': 'abd'},
  ], [
    {'@message': 'abcd'},
  ]),
  'regex': filter_helper.create('grep', '?regex=\\d', [
    {'@message': 'abcd'},
    {'@message': 'abd5'},
  ], [
    {'@message': 'abd5'},
  ]),
}).export(module);