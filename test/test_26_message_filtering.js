var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Message filtering ').addBatch({
  'nothing': filter_helper.create('compute_field', 'titi?value=a', [
    {'@message': 'toto'},
  ], [
    {'@message': 'toto', '@fields': {'titi': 'a'}},
  ]),
  'only type': filter_helper.create('compute_field', 'titi?value=a&only_type=z', [
    {'@message': 'toto'},
    {'@message': 'toto', '@type': 'tata'},
    {'@message': 'toto', '@type': 'z'},
  ], [
    {'@message': 'toto'},
    {'@message': 'toto', '@type': 'tata'},
    {'@message': 'toto', '@type': 'z', '@fields': {'titi': 'a'}},
  ]),
}).export(module);