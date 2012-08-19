var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter add timestamp ').addBatch({
  'normal': filter_helper.create_with_callback('add_timestamp', '', [{}], 1, function(result) {
    assert.ok(result[0]['@timestamp']);
  }),
  'not overwrite': filter_helper.create('add_timestamp', '', [{'@timestamp': 'toto'}], [{'@timestamp': 'toto'}]),
}).export(module);