var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper'),
    logstash_event = require('../lib/lib/logstash_event');

vows.describe('Filter compute field ').addBatch({
  'normal': filter_helper.create('compute_field', 'titi?value=ab', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 'tata'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'ab'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 'tata', 'titi': 'ab'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'with value': filter_helper.create('compute_field', 'titi?value=ab#{bouh}', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 'tata'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 42}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 42, 'titi': 'abcdef'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 'tata', 'titi': 'abtata'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 42, 'titi': 'ab42'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'bouh': 42, 'titi': 'ab42'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
}).export(module);