var vows = require('vows'),
    assert = require('assert'),
    filter_helper = require('./filter_helper');

vows.describe('Filter compute field ').addBatch({
  'normal': filter_helper.create('compute_field', 'titi?value=ab', [
    {'@message': 'toto'},
    {'@message': 'toto', '@fields': {'bouh': 'tata'}},
  ], [
    {'@message': 'toto', '@fields': {'titi': 'ab'}},
    {'@message': 'toto', '@fields': {'bouh': 'tata', 'titi': 'ab'}},
  ]),
  'with value': filter_helper.create('compute_field', 'titi?value=ab#{bouh}', [
    {'@message': 'toto'},
    {'@message': 'toto', '@fields': {'bouh': 'tata'}},
    {'@message': 'toto', '@fields': {'bouh': 42}},
    {'@message': 'toto', '@fields': {'bouh': 42, 'titi': 'abcdef'}},
  ], [
    {'@message': 'toto'},
    {'@message': 'toto', '@fields': {'bouh': 'tata', 'titi': 'abtata'}},
    {'@message': 'toto', '@fields': {'bouh': 42, 'titi': 'ab42'}},
    {'@message': 'toto', '@fields': {'bouh': 42, 'titi': 'ab42'}},
  ]),
}).export(module);