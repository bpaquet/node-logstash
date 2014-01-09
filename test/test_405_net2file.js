var vows = require('vows-batch-retry'),
  fs = require('fs'),
  net = require('net'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration net 2 file :').addBatchRetry({
  'net2file': {
    topic: function() {
      var callback = this.callback;
      helper.createAgent([
        'input://tcp://localhost:17874?type=2',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        var c = net.createConnection({
          port: 17874
        }, function() {
          c.write('toto');
          c.end();
        });
        c.on('end', function() {
          setTimeout(function() {
            agent.close(function() {
              callback(null);
            });
          }, 100);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');

      var splitted = c1.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {
        '@version': '1',
        'host': '127.0.0.1',
        'tcp_port': 17874,
        'message': 'toto',
        'type': '2'
      });
    }
  },
}, 5, 20000).addBatchRetry({
  'file2net': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var reqs = [];
      var current = [];
      var conns = 0;
      var connection_callback = function(c) {
        conns = conns + 1;
        current.push(c);
        c.on('data', function(data) {
          reqs.push(data.toString());
        });
      };
      var server = net.createServer(connection_callback);
      server.listen(17874);
      helper.createAgent([
        'input://file://main_input.txt',
        'output://tcp://localhost:17874?serializer=raw&delimiter=',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('main_input.txt', 'line 1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile('main_input.txt', 'line 2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  current.forEach(function(c) {
                    c.end();
                  });
                  server.close(function() {
                    server = net.createServer(connection_callback);
                    server.listen(17874);
                    setTimeout(function() {
                      fs.appendFile('main_input.txt', 'line 3\n', function(err) {
                        assert.ifError(err);
                        setTimeout(function() {
                          agent.close(function() {
                            server.close(function() {
                              callback(null, reqs, conns);
                            });
                          });
                        }, 200);
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

    check: function(err, reqs, conns) {
      assert.ifError(err);
      fs.unlinkSync('main_input.txt');
      assert.equal(2, conns);
      assert.deepEqual(reqs, [
        'line 1',
        'line 2',
        'line 3',
      ]);
    }
  },
}, 5, 20000).export(module);
