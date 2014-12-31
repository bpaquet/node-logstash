var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter multiline ').addBatch({
  'normal': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {
      'message': 'abc',
      'host': 'a'
    },
    {
      'message': 'ABC',
      'host': 'a'
    },
    {
      'message': 'abc',
      'host': 'a'
    },
    {
      'message': '123',
      'host': 'a'
    },
  ], [
    {
      'message': 'abc\nABC',
      'host': 'a'
    },
    {
      'message': 'abc\n123',
      'host': 'a'
    },
  ]),
  'regex flags': filter_helper.create('multiline', '?start_line_regex=^abc&regex_flags=i', [
    {
      'message': 'abc',
      'host': 'a'
    },
    {
      'message': 'ABC',
      'host': 'a'
    },
    {
      'message': 'abc',
      'host': 'a'
    },
    {
      'message': '123',
      'host': 'a'
    },
  ], [
    {
      'message': 'abc',
      'host': 'a'
    },
    {
      'message': 'ABC',
      'host': 'a'
    },
    {
      'message': 'abc\n123',
      'host': 'a'
    },
  ]),
  'wrong initial content': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {
      'message': 'def',
      'host': 'a'
    },
    {
      'message': 'abc',
      'host': 'a'
    },
    {
      'message': '123',
      'host': 'a'
    },
  ], [
    {
      'message': 'def',
      'host': 'a'
    },
    {
      'message': 'abc\n123',
      'host': 'a'
    },
  ]),
  'multiple sources': filter_helper.create('multiline', '?start_line_regex=^abc', [
    {
      'message': 'abc',
      'host': 'a'
    },
    {
      'message': 'abc',
      'host': 'b'
    },
    {
      'message': 'def',
      'host': 'a'
    },
    {
      'message': '123',
      'host': 'b'
    },
  ], [
    {
      'message': 'abc\ndef',
      'host': 'a'
    },
    {
      'message': 'abc\n123',
      'host': 'b'
    },
  ]),
  'with carring return in regex': filter_helper.create('multiline', '?start_line_regex=^titi&regex_flags=m', [
    {
      'message': 'titil1 toto\ntataabc\ntitil2',
    },
    {
      'message': 'bouh',
    },
    {
      'message': 'abc\ntiti',
    },
  ], [
    {
      'message': 'titil1 toto\ntataabc\ntitil2\nbouh',
    },
    {
      'message': 'abc\ntiti',
    },
  ]),
}).export(module);
