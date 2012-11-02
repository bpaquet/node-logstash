var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper'),
    logstash_event = require('../lib/lib/logstash_event');

vows.describe('Filter replace ').addBatch({
  'nothing': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [logstash_event.create({'@timestamp': '2012-01-01T01:00:00.000Z'})], [logstash_event.create({'@timestamp': '2012-01-01T01:00:00.000Z'})]),
  'normal': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [logstash_event.create({'@fields': {'toto': 'my.domain'}, '@timestamp': '2012-01-01T01:00:00.000Z'})], [logstash_event.create({'@fields': {'toto': 'my-domain'}, '@timestamp': '2012-01-01T01:00:00.000Z'})]),
  'multiple': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [logstash_event.create({'@fields': {'toto': 'my.domain.com'}, '@timestamp': '2012-01-01T01:00:00.000Z'})], [logstash_event.create({'@fields': {'toto': 'my-domain-com'}, '@timestamp': '2012-01-01T01:00:00.000Z'})]),
  'type_filtering': filter_helper.create(
    'mutate_replace',
    'toto?only_type=titi&from=\\.&to=-', [
      logstash_event.create({'@type': 'titi', '@fields': {'toto': 'my.domain.com'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
      logstash_event.create({'@fields': {'toto': 'my.domain2.com'}, '@timestamp': '2012-01-01T01:00:00.000Z'})
    ], [
      logstash_event.create({'@type': 'titi',  '@fields': {'toto': 'my-domain-com'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
      logstash_event.create({'@fields': {'toto': 'my.domain2.com'}, '@timestamp': '2012-01-01T01:00:00.000Z'})
    ]),
}).export(module);