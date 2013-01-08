var vows = require('vows'),
    assert = require('assert'),
    filter_helper = require('./filter_helper');

vows.describe('Filter replace ').addBatch({
  'nothing': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{}], [{}]),
  'normal': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{'@fields': {'toto': 'my.domain'}}], [{'@fields': {'toto': 'my-domain'}}]),
  'float': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{'@fields': {'toto': 10.42}}], [{'@fields': {'toto': '10-42'}}]),
  'multiple': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{'@fields': {'toto': 'my.domain.com'}}], [{'@fields': {'toto': 'my-domain-com'}}]),
  'type_filtering': filter_helper.create(
    'mutate_replace',
    'toto?only_type=titi&from=\\.&to=-', [
      {'@type': 'titi', '@fields': {'toto': 'my.domain.com'}},
      {'@fields': {'toto': 'my.domain2.com'}}
    ], [
      {'@type': 'titi',  '@fields': {'toto': 'my-domain-com'}},
      {'@fields': {'toto': 'my.domain2.com'}}
    ]),
}).export(module);
