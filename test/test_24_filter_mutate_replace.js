var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter replace ').addBatch({
  'nothing': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{}], [{}]),
  'normal': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{'@fields': {'toto': 'my.domain'}}], [{'@fields': {'toto': 'my-domain'}}]),
  'multiple': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{'@fields': {'toto': 'my.domain.com'}}], [{'@fields': {'toto': 'my-domain-com'}}]),
}).export(module);