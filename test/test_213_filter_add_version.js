var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter add version ').addBatch({
  'normal': filter_helper.create('add_version', '', [{}], [{
    '@version': '1'
  }]),
  'not overwrite': filter_helper.create('add_version', '', [{
    '@version': '2'
  }], [{
    '@version': '2'
  }]),
}).export(module);
