var vows = require('vows-batch-retry'),
  fs = require('fs'),
  os = require('os'),
  net = require('net'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration log io :').addBatchRetry({
  'logio': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var reqs = [];
      var server = net.createServer(function(c) {
        c.on('data', function(data) {
          data.toString().split('\r\n').forEach(function(s) {
            if (s !== '') {
              reqs.push(s);
            }
          });
        });
      });
      server.listen(17874);
      helper.createAgent([
        'input://file://main_input.txt',
        'input://file://main_input.txt?type=toto',
        'output://logio://localhost:17874',
        'output://logio://localhost:17874?priority=#{type}',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('main_input.txt', 'line 1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              agent.close(function() {
                server.close(function() {
                  callback(null, reqs);
                });
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      fs.unlinkSync('main_input.txt');
      assert.deepEqual(reqs.sort(), [
        '+log|' + os.hostname() + '|no_type|info|line 1',
        '+log|' + os.hostname() + '|no_type|undefined|line 1',
        '+log|' + os.hostname() + '|toto|info|line 1',
        '+log|' + os.hostname() + '|toto|toto|line 1',
      ]);
    }
  },
}, 5, 20000).export(module);
