var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper'),
    logstash_event = require('../lib/lib/logstash_event');

vows.describe('Filter multiline ').addBatch({
  'normal': filter_helper.create('multiline', '?start_line_regex=^abc', [
    logstash_event.create({'@message': 'abc', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'def', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abc', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': '123', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'abc\ndef', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abc\n123', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'wrong initial content': filter_helper.create('multiline', '?start_line_regex=^abc', [
    logstash_event.create({'@message': 'def', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abc', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': '123', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'def', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abc\n123', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'multiple sources': filter_helper.create('multiline', '?start_line_regex=^abc', [
    logstash_event.create({'@message': 'abc', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abc', '@source_host': 'b', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'def', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': '123', '@source_host': 'b', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'abc\ndef', '@source_host': 'a', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abc\n123', '@source_host': 'b', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
}).export(module);