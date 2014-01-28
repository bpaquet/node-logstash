var vows = require('vows-batch-retry'),
  fs = require('fs'),
  dgram = require('dgram'),
  assert = require('assert'),
  monitor_file = require('lib/monitor_file'),
  helper = require('./integration_helper.js');

vows.describe('Integration elasticsearch zeromq:').addBatchRetry({
  'elasticsearch test': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'output://elasticsearch_zeromq://tcp://localhost:17875',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        helper.createAgent([
          'input://zeromq://tcp://0.0.0.0:17875',
          'output://file://output.txt',
        ], function(agent2) {
          var line = new Buffer('message 42\n');
          socket.send(line, 0, line.length, 17874, 'localhost', function(err) {
            if (err) {
              return callback(err);
            }
            setTimeout(function() {
              socket.close();
              agent2.close(function() {
                agent.close(callback);
              });
            }, 200);
          });
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal(splitted[1], '');
      var l = splitted[0].split('|');
      assert.equal(l.length, 3);
      assert.equal(l[0], 'POST');
      assert.match(l[1], /\/logstash-20.*\/logs/);
      helper.checkResult(l[2], {
        message: 'message 42',
        host: '127.0.0.1',
        udp_port: 17874,
        type: 'udp',
        '@version': '1'
      });
    }
  },
}, 5, 20000).addBatchRetry({
  'standard test': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'output://zeromq://tcp://localhost:17875',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        helper.createAgent([
          'input://zeromq://tcp://0.0.0.0:17875',
          'output://file://output.txt',
        ], function(agent2) {
          var line = new Buffer('message 42\n');
          socket.send(line, 0, line.length, 17874, 'localhost', function(err) {
            if (err) {
              return callback(err);
            }
            setTimeout(function() {
              socket.close();
              agent2.close(function() {
                agent.close(callback);
              });
            }, 200);
          });
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal(splitted[1], '');
      assert.equal(splitted[0], 'message 42');
    }
  },
}, 5, 20000).export(module);
