var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter add timestamp ').addBatch({
  'normal': filter_helper.create('add_timestamp', '', 1, function(filter) {
    filter.emit('input', {});
  }, function(result) {
    assert.ok(result[0]['@timestamp']);
  }),
  'not overwrite': filter_helper.create('add_timestamp', '', 1, function(filter) {
    filter.emit('input', {'@timestamp': 'toto'});
  }, function(result) {
    assert.equal(result[0]['@timestamp'], 'toto');
  }),
}).export(module);