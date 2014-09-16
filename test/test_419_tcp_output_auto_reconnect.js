var vows = require('vows-batch-retry'),
  net = require('net'),
  dgram = require('dgram'),
  assert = require('assert'),
  helper = require('./integration_helper.js');

vows.describe('Integration tcp output auto reconnect (#70)').addBatchRetry({
  'issue 75': {
    topic: function() {
      var callback = this.callback;
      helper.createAgent([
        'input://udp://127.0.0.1:45567',
        'output://tcp://127.0.0.1:45568',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        var udp_send = function(s) {
          var buffer = new Buffer(s);
          socket.send(buffer, 0, buffer.length, 45567, 'localhost', function(err, bytes) {
            if (err || bytes !== buffer.length) {
              assert.fail('Unable to send udp packet');
            }
          });
        };
        var current_connection;
        var server = net.createServer(function(cc) {
          current_connection = cc;
          cc.on('data', function(l) {
            assert(l.toString().match(/toto1/));
            cc.end();
            server.close(function() {
              setTimeout(function() {
                udp_send('toto2');
                setTimeout(function() {
                  server = net.createServer(function(cc) {
                    cc.on('data', function(l) {
                      assert(l.toString().match(/toto3/));
                      cc.end();
                      server.close(function() {
                        agent.close(callback);
                      });
                    });
                  });
                  server.on('listening', function() {
                    udp_send('toto3');
                  });
                  server.listen(45568);
                }, 1000);
              }, 500);
            });
          });
        });
        server.on('listening', function() {
          udp_send('toto1');
        });
        server.listen(45568);
      }, function() {
      });
    },

    check: function(err) {
      assert.ifError(err);
    }
  },
}, 5, 20000).export(module);
