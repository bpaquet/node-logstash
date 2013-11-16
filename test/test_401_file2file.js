var vows = require('vows-batch-retry'),
    fs = require('fs'),
    assert = require('assert'),
    helper = require('./integration_helper.js'),
    monitor_file = require('../lib/lib/monitor_file');

vows.describe('Integration file 2 file :').addBatchRetry({
  'file2file': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        'input://file://input1.txt',
        'input://file://input2.txt?type=input2',
        'output://file://output1.txt?serializer=json_logstash',
        'output://file://output2.txt?serializer=json_logstash',
        'output://file://output3.txt?serializer=raw&format=_#{message}_',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', 'line1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile('input2.txt', 'line2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  fs.appendFile('input1.txt', 'line3\n', function(err) {
                    assert.ifError(err);
                    setTimeout(function() {
                      agent.close(function() {
                        callback(null);
                      });
                    }, 200);
                  });
                }, 200);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output1.txt').toString();
      var c2 = fs.readFileSync('output2.txt').toString();
      var c3 = fs.readFileSync('output3.txt').toString();
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('output1.txt');
      fs.unlinkSync('output2.txt');
      fs.unlinkSync('output3.txt');

      assert.equal(c1, c2);
      var splitted = c1.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {'@version': '1', 'path': 'input1.txt', 'message': 'line1'}, true);
      helper.checkResult(splitted[1], {'@version': '1', 'path': 'input2.txt', 'message': 'line2', 'type': 'input2'}, true);
      helper.checkResult(splitted[2], {'@version': '1', 'path': 'input1.txt', 'message': 'line3'}, true);

      assert.equal('_line1_\n_line2_\n_line3_\n', c3);
    }
  },
}, 5, 20000).addBatchRetry({
  'file2file not existing dir': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        'input://file://toto/56/87/input.txt',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        setTimeout(function() {
          fs.mkdir('toto', function(err) {
            assert.ifError(err);
            fs.mkdir('toto/56', function(err) {
              assert.ifError(err);
              fs.mkdir('toto/56/87', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  fs.appendFile('toto/56/87/input.txt', 'line1\n', function(err) {
                    assert.ifError(err);
                    fs.appendFile('toto/56/87/input.txt', 'line2\n', function(err) {
                      assert.ifError(err);
                      setTimeout(function() {
                        agent.close(function() {
                          callback(null);
                        });
                      }, 200);
                    });
                  });
                });
              });
            });
          });
        }, 500);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('toto/56/87/input.txt');
      fs.rmdirSync('toto/56/87');
      fs.rmdirSync('toto/56');
      fs.rmdirSync('toto');
      fs.unlinkSync('output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 3);
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {'@version': '1', 'path': 'toto/56/87/input.txt', 'message': 'line1'}, true);
      helper.checkResult(splitted[1], {'@version': '1', 'path': 'toto/56/87/input.txt', 'message': 'line2'}, true);
    }
  },
}, 5, 20000).export(module);