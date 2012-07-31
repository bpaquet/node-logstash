var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter regex ').addBatch({
  'normal': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa,fb', 2, function(filter) {
    filter.emit('input', {'@message': 'abcd efgh ijk'});
    filter.emit('input', {'@message': 'abcdefghijk'});
  }, function(result) {
    assert.deepEqual(result[0]['@fields'], {fa: 'abcd', fb: 'efgh'});
    assert.deepEqual(result[1]['@fields'], undefined);
  }),
  'type filtering': filter_helper.create('regex', '?type=toto&regex=^(\\S+) (\\S+)&fields=fa,fb', 3, function(filter) {
    filter.emit('input', {'@message': 'abcd efgh ijk'});
    filter.emit('input', {'@message': 'abcd efgh ijk', '@type': 'toto'});
    filter.emit('input', {'@message': 'abcd efgh ijk', '@type': 'toto2'});
  }, function(result) {
    assert.deepEqual(result[0]['@fields'], undefined);
    assert.deepEqual(result[1]['@fields'], {fa: 'abcd', fb: 'efgh'});
    assert.deepEqual(result[2]['@fields'], undefined);
  }),
  'wrong regex 1': filter_helper.create('regex', '?regex=^(\\S+) \\S+&fields=fa,fb', 1, function(filter) {
    filter.emit('input', {'@message': 'abcd efgh ijk'});
  }, function(result) {
    assert.deepEqual(result[0]['@fields'], {fa: 'abcd'});
  }),
  'wrong regex 2': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa', 1, function(filter) {
    filter.emit('input', {'@message': 'abcd efgh ijk'});
  }, function(result) {
    assert.deepEqual(result[0]['@fields'], {fa: 'abcd'});
  }),
}).export(module);