var vows = require('vows-batch-retry'),
  fs = require('fs'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration filter without params and only_type (issue #62)').addBatchRetry({
  'issue 62': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        'input://file://input.txt?type=toto',
        'filter://bunyan://?only_type=tata',
        'output://file://output.txt',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input.txt', '{"name":"myapp","hostname":"banquise.local","pid":6442,"level":30,"msg":"hi","time":"2014-05-31T20:32:53.902Z","v":0}\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              agent.close(function() {
                callback(null);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('input.txt');
      fs.unlinkSync('output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal(splitted[0], '{"name":"myapp","hostname":"banquise.local","pid":6442,"level":30,"msg":"hi","time":"2014-05-31T20:32:53.902Z","v":0}');
    }
  },
}, 5, 20000).export(module);
