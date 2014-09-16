var vows = require('vows-batch-retry'),
  net = require('net'),
  assert = require('assert'),
  helper = require('./integration_helper.js');

vows.describe('Integration good tcp closing (#75)').addBatchRetry({
  'issue 75': {
    topic: function() {
      var callback = this.callback;
      helper.createAgent([
        'input://tcp://127.0.0.1:45567',
      ], function(agent) {
        var c = net.connect({host: '127.0.0.1', port: 45567});
        c.on('connect', function() {
          var closed = false;
          c.on('close', function() {
            closed = true;
          });
          setTimeout(function() {
            agent.close(function() {
              setTimeout(function() {
                callback(null, closed);
              }, 100);
            });
          }, 200);
        });
      });
    },

    check: function(err, closed) {
      assert.ifError(err);
      assert.equal(closed, true);
    }
  },
}, 5, 20000).export(module);
