var vows = require('vows-batch-retry'),
  fs = require('fs'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

function file100(config) {
  var timer = 200;
  return {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        config,
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        setTimeout(function() {
          var f = function(k, callback) {
            if (k === 110) {
              return callback();
            }
            fs.appendFile('input' + k + '.txt', 'line' + k + '\n', function(err) {
              assert.ifError(err);
              f(k + 1, callback);
            });
          };
          f(0, function() {
            setTimeout(function() {
              agent.close(function() {
                callback(null);
              });
            }, timer);
          });
        }, 500);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');
      for (var i = 0; i < 110; i++) {
        fs.unlinkSync('input' + i + '.txt');
      }

      var splitted = c.split('\n');
      assert.equal(splitted.length, 91);
      assert.equal('', splitted[splitted.length - 1]);
      for (var k = 10; k < 100; k++) {
        helper.checkResult(splitted[k - 10], {
          '@version': '1',
          'path': 'input' + k + '.txt',
          'message': 'line' + k
        }, true);
      }
    }
  };
}

vows.describe('Integration file wildcard :').addBatchRetry({
  '110 files': file100('input://file://input%3F%3F.txt'),
}, 5, 20000).addBatchRetry({
  '110 files use tail': file100('input://file://input%3F%3F.txt?use_tail=true'),
}, 5, 20000).addBatchRetry({
  'file already exists and remove': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      fs.appendFile('input01.txt', 'toto\n', function(err) {
        assert.ifError(err);
        helper.createAgent([
          'input://file://input%3F%3F.txt',
          'output://file://output.txt?serializer=json_logstash',
        ], function(agent) {
          setTimeout(function() {
            fs.appendFile('input01.txt', 'tata\n', function(err) {
              assert.ifError(err);
              setTimeout(function() {
                fs.unlink('input01.txt', function(err) {
                  assert.ifError(err);
                  setTimeout(function() {
                    fs.appendFile('input01.txt', 'titi\n', function(err) {
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
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');
      var splitted = c.split('\n');
      assert.equal(splitted.length, 3);
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {
        '@version': '1',
        'path': 'input01.txt',
        'message': 'tata'
      }, true);
      helper.checkResult(splitted[1], {
        '@version': '1',
        'path': 'input01.txt',
        'message': 'titi'
      }, true);
    }
  },
}, 5, 20000).addBatchRetry({
  'file already exists use tail': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      fs.appendFile('input01.txt', 'toto\n', function(err) {
        assert.ifError(err);
        helper.createAgent([
          'input://file://input%3F%3F.txt?use_tail=true',
          'output://file://output.txt?serializer=json_logstash',
        ], function(agent) {
          setTimeout(function() {
            fs.appendFile('input01.txt', 'tata\n', function(err) {
              assert.ifError(err);
              setTimeout(function() {
                fs.unlink('input01.txt', function(err) {
                  assert.ifError(err);
                  setTimeout(function() {
                    fs.appendFile('input01.txt', 'titi\n', function(err) {
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
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');
      var splitted = c.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {
        '@version': '1',
        'path': 'input01.txt',
        'message': 'tata'
      }, true);
    }
  }
}, 5, 20000).export(module);
