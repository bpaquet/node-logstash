var vows = require('vows-batch-retry'),
  fs = require('fs'),
  dgram = require('dgram'),
  assert = require('assert'),
  monitor_file = require('lib/monitor_file'),
  helper = require('./integration_helper.js');

function loop(x, socket, delay, callback) {
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
      setTimeout(function() {
        loop(x - 1, socket, delay, callback);
      }, delay);
    });
  });
}

vows.describe('Integration closing inputs:').addBatchRetry({
  'normal': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'input://file://input.txt?type=file',
        'output://file://output_file.txt?only_type=file&serializer=json_logstash',
        'output://file://output_udp.txt?only_type=udp&serializer=json_logstash',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        loop(500, socket, 10, function(err) {
          assert.ifError(err);
          setTimeout(function() {
            socket.close();
            agent.close(callback);
          }, 100);
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
      assert.equal(splitted_1.length, 500 + 1);

      var splitted_2 = c2.split('\n');
      assert.equal(splitted_2.length, 500 + 1);
    }
  },
}, 5, 20000).addBatch({
  'closing before stop': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'input://file://input.txt?type=file',
        'output://file://output_file.txt?only_type=file&serializer=json_logstash',
        'output://file://output_udp.txt?only_type=udp&serializer=json_logstash',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        loop(500, socket, 10, function(err) {
          assert.ifError(err);
          setTimeout(function() {
            agent.close_inputs(function(err) {
              assert.isTrue(agent.closed_inputs);
              assert.ifError(err);
              setTimeout(function() {
                socket.close();
                agent.close(callback);
              }, 100);
            });
          }, 100);
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
      assert.equal(splitted_1.length, 500 + 1);

      var splitted_2 = c2.split('\n');
      assert.equal(splitted_2.length, 500 + 1);
    }
  },
}, 5, 20000).addBatchRetry({
  'closing': {
    topic: function() {
      var callback = this.callback;
      monitor_file.setFileStatus({});
      helper.createAgent([
        'input://udp://localhost:17874?type=udp',
        'input://file://input.txt?type=file',
        'output://file://output_file.txt?only_type=file&serializer=json_logstash',
        'output://file://output_udp.txt?only_type=udp&serializer=json_logstash',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        loop(500, socket, 5, function(err) {
          assert.ifError(err);
          setTimeout(function() {
            socket.close();
            agent.close(callback);
          }, 100);
        });
        setTimeout(function() {
          assert.isFalse(agent.closed_inputs);
          agent.close_inputs(function(err) {
            assert.isTrue(agent.closed_inputs);
            assert.ifError(err);
            setTimeout(function() {
              agent.start_inputs(function(err) {
                assert.ifError(err);
                assert.isFalse(agent.closed_inputs);
              });
            }, 500);
          });
        }, 1000);
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
      assert.equal(splitted_1.length, 500 + 1);

      var splitted_2 = c2.split('\n');
      assert.lesser(splitted_2.length, 500);
    }
  },
}, 5, 20000).export(module);
