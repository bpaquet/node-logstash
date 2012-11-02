var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper'),
    logstash_event = require('../lib/lib/logstash_event');

vows.describe('Filter grep ').addBatch({
  'normal': filter_helper.create('grep', '?regex=abc', [
    logstash_event.create({'@message': 'abcd', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abd', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'abcd', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'regex': filter_helper.create('grep', '?regex=\\d', [
    logstash_event.create({'@message': 'abcd', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'abd5', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'abd5', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
}).export(module);