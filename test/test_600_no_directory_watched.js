var vows = require('vows'),
  assert = require('assert'),
  directory_watcher = require('../lib/lib/directory_watcher');

vows.describe('Check directory watcher').addBatch({
  'is empty': {
    topic: function() {
      return directory_watcher.current;
    },

    check: function(l) {
      assert.equal(Object.keys(l), 0);
    }
  }
}).export(module);
