var vows = require('vows'),
    assert = require('assert'),
    moment = require('moment'),
    patterns_loader = require('../lib/lib/patterns_loader'),
    filter_helper = require('./filter_helper');

var n = moment();

patterns_loader.add('/toto');
patterns_loader.add('/tata');
patterns_loader.add('../lib/patterns');

vows.describe('Filter json_fields ').addBatch({
  'basic': filter_helper.create('json_fields', '', [
    {'@message': '{"abcd":"efgh","ijk":["l","m","n"]}'},
    {'@message': '{"abcd":"ef\\"\\ngh","ijk":["l","m","n"]}'},
  ], [
    {'@message': '{"abcd":"efgh","ijk":["l","m","n"]}', '@fields': {abcd: 'efgh', ijk: ['l','m','n']}},
    {'@message': '{"abcd":"ef\\"\\ngh","ijk":["l","m","n"]}', '@fields': {abcd: 'ef\"\ngh', ijk: ['l','m','n']}},
  ]),
  'empty': filter_helper.create('json_fields', '', [
    {'@message': '{}'},
    {'@message': '{}', '@fields': {fc: 'toto'}},
  ], [
    {'@message': '{}', '@fields': {}},
    {'@message': '{}', '@fields': {fc: 'toto'}},
  ]),
  'merge': filter_helper.create('json_fields', '', [
    {'@message': '{"abcd":"efgh","ijk":["l","m","n"]}', '@fields': {fc: 'toto'}},
  ], [
    {'@message': '{"abcd":"efgh","ijk":["l","m","n"]}', '@fields': {fc: 'toto', abcd: 'efgh', ijk: ['l','m','n']}},
  ]),
  'overwrite': filter_helper.create('json_fields', '', [
    {'@message': '{"abcd":"efgh","ijk":["l","m","n"]}', '@fields': {fc: 'toto', abcd: 'toto'}},
  ], [
    {'@message': '{"abcd":"efgh","ijk":["l","m","n"]}', '@fields': {fc: 'toto', abcd: 'efgh', ijk: ['l','m','n']}},
  ]),
  'numeric': filter_helper.create('json_fields', '', [
    {'@message': '{"abcd":0,"ijk":[1,2,3]}'},
  ], [
    {'@message': '{"abcd":0,"ijk":[1,2,3]}', '@fields': {abcd: 0, ijk: [1,2,3]}},
  ]),
  'object': filter_helper.create('json_fields', '', [
    {'@message': '{"abcd":{"ef":"g","h":0},"ijk":[1,2,-3.5e-2]}'},
  ], [
    {'@message': '{"abcd":{"ef":"g","h":0},"ijk":[1,2,-3.5e-2]}', '@fields': {abcd: {ef: 'g', h: 0}, ijk: [1,2,-0.035]}},
  ]),
  'boolean': filter_helper.create('json_fields', '', [
    {'@message': '{"abcd":true,"efg":false}'},
  ], [
    {'@message': '{"abcd":true,"efg":false}', '@fields': {abcd: true, efg: false}},
  ]),
  'null': filter_helper.create('json_fields', '', [
    {'@message': '{"abcd":null}'},
  ], [
    {'@message': '{"abcd":null}', '@fields': {abcd: null}},
  ]),
  'corner_cases': filter_helper.create('json_fields', '', [
    {'@message': ''},
    {'@message': '{'},
    {'@message': '{[]'},
    {'@message': '<123>{"abc":"efg"}'},
    {'@message': '<123>[}'},
    {'@message': '<123>[]'},
  ], [
    {'@message': '','@fields':{}},
    {'@message': '{','@fields':{}},
    {'@message': '{[]','@fields':{}},
    {'@message': '<123>{"abc":"efg"}','@fields':{abc:'efg'}},
    {'@message': '<123>[}','@fields':{}},
    {'@message': '<123>[]','@fields':{}},
  ]),
}).export(module);
