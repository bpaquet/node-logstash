var vows = require('vows'),
  os = require('os'),
  filter_helper = require('./filter_helper');

vows.describe('Filter add host ').addBatch({
  'normal': filter_helper.create('add_host', '', [{}], [{
    'host': os.hostname()
  }]),
  'not overwrite': filter_helper.create('add_host', '', [{
    'host': 'toto'
  }], [{
    'host': 'toto'
  }]),
}).export(module);
