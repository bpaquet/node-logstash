var vows = require('vows-batch-retry'),
  fs = require('fs'),
  assert = require('assert'),
  path = require('path'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration file 2 file :').addBatch({
  'single': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        'input://file://input.txt?tags=a&add_field=a:b',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input.txt', 'line1\n', function(err) {
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
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {
        '@version': '1',
        'path': path.resolve('.') + '/input.txt',
        'message': 'line1',
        'tags': ['a'],
        'a': 'b',
      }, true);
    }
  },
}).addBatch({
  'mutiple': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        'input://file://input.txt?tags=a,2,3&add_fields=a:b,xxx:12',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input.txt', 'line1\n', function(err) {
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
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {
        '@version': '1',
        'path': path.resolve('.') + '/input.txt',
        'message': 'line1',
        'tags': ['a', '2', '3'],
        'a': 'b',
        'xxx': '12',
      }, true);
    }
  },
}).export(module);
