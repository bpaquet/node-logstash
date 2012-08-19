var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter regex ').addBatch({
  'normal': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa,fb', [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@fields': {fc: 'toto'}},
    {'@message': 'abcdefghijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd', fb: 'efgh'}},
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd', fb: 'efgh', fc: 'toto'}},
    {'@message': 'abcdefghijk'},
  ]),
  'type filtering': filter_helper.create('regex', '?type=toto&regex=^(\\S+) (\\S+)&fields=fa,fb', [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@type': 'toto'},
    {'@message': 'abcd efgh ijk', '@type': 'toto2'},
  ], [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@type': 'toto', '@fields': {fa: 'abcd', fb: 'efgh'}},
    {'@message': 'abcd efgh ijk', '@type': 'toto2'},
  ]),
  'two fields one in regex': filter_helper.create('regex', '?regex=^(\\S+) \\S+&fields=fa,fb', [
     {'@message': 'abcd efgh ijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd'}},
  ]),
  'one field two in regex': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa', [
    {'@message': 'abcd efgh ijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd'}},
  ]),
}).export(module);