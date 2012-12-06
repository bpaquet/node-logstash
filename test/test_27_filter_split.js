var vows = require('vows'),
    assert = require('assert'),
    filter_helper = require('./filter_helper');

vows.describe('Filter split ').addBatch({
  'normal': filter_helper.create('split', '?delimiter=|', [
    {'@message': 'toto||tata|titi', '@source_host': 'a'},
    {'@message': 'tete|bouh|', '@source_host': 'b'},
  ], [
    {'@message': 'toto', '@source_host': 'a'},
    {'@message': 'tata', '@source_host': 'a'},
    {'@message': 'titi', '@source_host': 'a'},
    {'@message': 'tete', '@source_host': 'b'},
    {'@message': 'bouh', '@source_host': 'b'},
  ]),
  'normal with fields and long delimiter': filter_helper.create('split', '?delimiter=|()', [
    {'@message': 'toto|()tata|()|()titi', '@source_host': 'a', '@fields': {'z': 2}},
  ], [
    {'@message': 'toto', '@source_host': 'a', '@fields': {'z': 2}},
    {'@message': 'tata', '@source_host': 'a', '@fields': {'z': 2}},
    {'@message': 'titi', '@source_host': 'a', '@fields': {'z': 2}},
  ]),
}).export(module);