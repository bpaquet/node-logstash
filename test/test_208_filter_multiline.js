var vows = require('vows'),
    filter_helper = require('./filter_helper');

vows.describe('Filter multiline ').addBatch({
  'normal': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {'message': 'abc', 'host': 'a'},
    {'message': 'def', 'host': 'a'},
    {'message': 'abc', 'host': 'a'},
    {'message': '123', 'host': 'a'},
  ], [
    {'message': 'abc\ndef', 'host': 'a'},
    {'message': 'abc\n123', 'host': 'a'},
  ]),
  'wrong initial content': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {'message': 'def', 'host': 'a'},
    {'message': 'abc', 'host': 'a'},
    {'message': '123', 'host': 'a'},
  ], [
    {'message': 'def', 'host': 'a'},
    {'message': 'abc\n123', 'host': 'a'},
  ]),
  'multiple sources': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {'message': 'abc', 'host': 'a'},
    {'message': 'abc', 'host': 'b'},
    {'message': 'def', 'host': 'a'},
    {'message': '123', 'host': 'b'},
  ], [
    {'message': 'abc\ndef', 'host': 'a'},
    {'message': 'abc\n123', 'host': 'b'},
  ]),
}).export(module);
