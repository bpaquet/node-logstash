var vows = require('vows-batch-retry'),
  fs = require('fs'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration multiline :').addBatchRetry({
  'multiline simple test': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        'input://file://input.txt',
        'filter://multiline://?start_line_regex=^1234',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input.txt', 'line1\nline2\n1234line3\n1234line4\nline5\n', function(err) {
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
      assert.equal(splitted.length, 4);
      assert.equal('', splitted[splitted.length - 1]);
      assert.equal(JSON.parse(splitted[0]).message, 'line1\nline2');
      assert.equal(JSON.parse(splitted[1]).message, '1234line3');
      assert.equal(JSON.parse(splitted[2]).message, '1234line4\nline5');
    }
  },
}, 5, 20000).export(module);
