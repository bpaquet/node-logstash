var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter add source ').addBatch({
  'normal': filter_helper.create('add_source_host', '', 1, function(filter) {
    filter.emit('input', {});
  }, function(result) {
    assert.equal(result[0]['@source_host'], os.hostname());
  }),
  'not overwrite': filter_helper.create('add_source_host', '', 1, function(filter) {
    filter.emit('input', {'@source_host': 'toto'});
  }, function(result) {
    assert.equal(result[0]['@source_host'], 'toto');
  }),
}).export(module);