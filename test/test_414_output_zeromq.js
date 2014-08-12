var vows = require('vows-batch-retry'),
  fs = require('fs'),
  dgram = require('dgram'),
  assert = require('assert'),
  monitor_file = require('lib/monitor_file'),
  helper = require('./integration_helper.js');

function loop(x, socket, callback) {
  if (x === 0) {
    return callback();
  }
  var line = new Buffer('line ' + x + '\n');
  socket.send(line, 0, line.length, 17874, 'localhost', function(err) {
    if (err) {
      return callback(err);
    }
    fs.appendFile('input.txt', line, function(err) {
      if (err) {
        return callback(err);
      }
      loop(x - 1, socket, callback);
    });
  });
}

vows.describe('Integration zeromq:').addBatch({
  'load balancing': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://zeromq://tcp://0.0.0.0:17875',
        'output://file://output1.txt',
      ], function(agent) {
        helper.createAgent([
          'input://zeromq://tcp://0.0.0.0:17876',
          'output://file://output2.txt',
        ], function(agent2) {
          helper.createAgent([
            'input://udp://localhost:17874?type=udp',
            'output://zeromq://tcp://localhost:17875,tcp://localhost:17876',
          ], function(agent3) {
            var socket = dgram.createSocket('udp4');
            socket.send(new Buffer('l1'), 0, 2, 17874, 'localhost', function(err) {
              assert.ifError(err);
              socket.send(new Buffer('l2'), 0, 2, 17874, 'localhost', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  socket.close();
                  agent3.close(function() {
                    agent2.close(function() {
                      agent.close(callback);
                    });
                  });
                }, 200);
              });
            });
          });
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output1.txt').toString();
      var c2 = fs.readFileSync('output2.txt').toString();
      fs.unlinkSync('output1.txt');
      fs.unlinkSync('output2.txt');

      var splitted1 = c1.split('\n');
      assert.equal(splitted1.length, 2);

      var splitted2 = c2.split('\n');
      assert.equal(splitted2.length, 2);
    }
  },
}).addBatchRetry({
  'no limit': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'output://zeromq://tcp://localhost:17875',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        loop(1000, socket, function(err) {
          assert.ifError(err);
          setTimeout(function() {
            helper.createAgent([
              'input://zeromq://tcp://0.0.0.0:17875',
              'output://file://output.txt',
            ], function(agent2) {
              setTimeout(function() {
                socket.close();
                agent2.close(function() {
                  agent.close(callback);
                });
              }, 1000);
            });
          }, 100);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');
      fs.unlinkSync('input.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 1000 + 1);
    }
  },
}, 5, 20000).addBatchRetry({
  'high watermark set to 100': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'output://zeromq://tcp://localhost:17875?zmq_high_watermark=100&zmq_check_interval=100',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        loop(1000, socket, function(err) {
          assert.ifError(err);
          setTimeout(function() {
            helper.createAgent([
              'input://zeromq://tcp://0.0.0.0:17875',
              'output://file://output.txt',
            ], function(agent2) {
              setTimeout(function() {
                assert.ifError(err);
                socket.close();
                agent2.close(function() {
                  agent.close(callback);
                });
              }, 1000);
            });
          }, 500);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');
      fs.unlinkSync('input.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 1000 + 1);
    }
  },
}, 5, 20000).addBatchRetry({
  'closed inputs': {
    topic: function() {
      var callback = this.callback;
      var received = false;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'input://file://input.txt?type=file',
        'output://zeromq://tcp://localhost:17875?zmq_high_watermark=100&zmq_check_interval=100&zmq_threshold_up=500&zmq_threshold_down=200',
      ], function(agent) {
        agent.once('alarm_mode', function(alarm) {
          assert.equal(true, alarm);
          agent.once('alarm_mode', function(alarm) {
            assert.equal(false, alarm);
            received = true;
            agent.once('alarm_mode', function() {
              assert.fail();
            });
          });
        });
        var socket = dgram.createSocket('udp4');
        assert.equal(false, agent.closed_inputs);
        loop(500, socket, function(err) {
          assert.ifError(err);
          setTimeout(function() {
            assert.equal(true, agent.closed_inputs);
            loop(500, socket, function(err) {
              assert.ifError(err);
              setTimeout(function() {
                helper.createAgent([
                  'input://zeromq://tcp://0.0.0.0:17875',
                  'output://file://output_udp.txt?only_type=udp',
                  'output://file://output_file.txt?only_type=file',
                ], function(agent2) {
                  setTimeout(function() {
                    assert.ifError(err);
                    console.log(received);
                    assert.equal(false, agent.closed_inputs);
                    assert.equal(true, received);
                    socket.close();
                    agent2.close(function() {
                      agent.close(callback);
                    });
                  }, 1000);
                });
              }, 500);
            });
          }, 50);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output_file.txt').toString();
      var c2 = fs.readFileSync('output_udp.txt').toString();
      fs.unlinkSync('output_file.txt');
      fs.unlinkSync('output_udp.txt');
      fs.unlinkSync('input.txt');

      var splitted_1 = c1.split('\n');
      assert.equal(splitted_1.length, 1000 + 1);

      var splitted_2 = c2.split('\n');
      assert.lesser(splitted_2.length, 1000);
    }
  },
}, 5, 20000).export(module);
