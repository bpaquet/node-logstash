var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper'),
    logstash_event = require('../lib/lib/logstash_event');

vows.describe('Message filtering ').addBatch({
  'nothing': filter_helper.create('compute_field', 'titi?value=a', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'a'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'only type': filter_helper.create('compute_field', 'titi?value=a&only_type=z', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@type': 'tata', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@type': 'z', '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@type': 'tata', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@type': 'z', '@fields': {'titi': 'a'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'only field exist': filter_helper.create('compute_field', 'titi?value=a&only_field_exist_titi', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'a'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'multiple only field exist': filter_helper.create('compute_field', 'titi?value=a&only_field_exist_titi&only_field_exist_toto', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'b', 'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'a', 'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'only field equal': filter_helper.create('compute_field', 'titi?value=a&only_field_equal_titi=z', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'z'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'a'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
  'multiple only field equal': filter_helper.create('compute_field', 'titi?value=aa&only_field_equal_titi=a&only_field_equal_toto=b', [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'a'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'a', 'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ], [
    logstash_event.create({'@message': 'toto', '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'a'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
    logstash_event.create({'@message': 'toto', '@fields': {'titi': 'aa', 'toto': 'b'}, '@timestamp': '2012-01-01T01:00:00.000Z'}),
  ]),
}).export(module);