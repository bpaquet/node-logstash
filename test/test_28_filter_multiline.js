var vows = require('vows'),
    assert = require('assert'),
    filter_helper = require('./filter_helper');

vows.describe('Filter multiline ').addBatch({
  'normal': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {'@message': 'abc', '@source_host': 'a'},
    {'@message': 'def', '@source_host': 'a'},
    {'@message': 'abc', '@source_host': 'a'},
    {'@message': '123', '@source_host': 'a'},
  ], [
    {'@message': 'abc\ndef', '@source_host': 'a'},
    {'@message': 'abc\n123', '@source_host': 'a'},
  ]),
  'wrong initial content': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {'@message': 'def', '@source_host': 'a'},
    {'@message': 'abc', '@source_host': 'a'},
    {'@message': '123', '@source_host': 'a'},
  ], [
    {'@message': 'def', '@source_host': 'a'},
    {'@message': 'abc\n123', '@source_host': 'a'},
  ]),
  'multiple sources': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {'@message': 'abc', '@source_host': 'a'},
    {'@message': 'abc', '@source_host': 'b'},
    {'@message': 'def', '@source_host': 'a'},
    {'@message': '123', '@source_host': 'b'},
  ], [
    {'@message': 'abc\ndef', '@source_host': 'a'},
    {'@message': 'abc\n123', '@source_host': 'b'},
  ]),
}).export(module);