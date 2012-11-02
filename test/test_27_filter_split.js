var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper'),
    logstash_event = require('../lib/lib/logstash_event');

vows.describe('Filter split ').addBatch({
  'normal': filter_helper.create('split', '?delimiter=|', [
    logstash_event.create({'@message': 'toto||tata|titi', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'tete|bouh|', '@source_host': 'b', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'tata', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'titi', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'tete', '@source_host': 'b', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'bouh', '@source_host': 'b', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'normal with fields and long delimiter': filter_helper.create('split', '?delimiter=|()', [
    logstash_event.create({'@message': 'toto|()tata|()|()titi', '@source_host': 'a', '@fields': {'z': 2}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@source_host': 'a', '@fields': {'z': 2}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'tata', '@source_host': 'a', '@fields': {'z': 2}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'titi', '@source_host': 'a', '@fields': {'z': 2}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
}).export(module);