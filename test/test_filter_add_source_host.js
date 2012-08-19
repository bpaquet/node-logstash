var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter add source ').addBatch({
  'normal': filter_helper.create('add_source_host', '', [{}], [{'@source_host': os.hostname()}]),
  'not overwrite': filter_helper.create('add_source_host', '', [{'@source_host': 'toto'}], [{'@source_host': 'toto'}]),
}).export(module);