var vows = require('vows-batch-retry'),
  fs = require('fs'),
  dgram = require('dgram'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration Json logstash event :').addBatchRetry({
  'json_logstash_event': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent([
        'input://udp://0.0.0.0:17854',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        var socket = dgram.createSocket('udp4');
        var udp_send = function(s) {
          var buffer = new Buffer(s);
          socket.send(buffer, 0, buffer.length, 17854, 'localhost', function(err, bytes) {
            if (err || bytes !== buffer.length) {
              assert.fail('Unable to send udp packet');
            }
          });
        };
        setTimeout(function() {
          udp_send('toto');
          setTimeout(function() {
            udp_send('{"tata":"toto","type":"titi","message":"oups"}');
            setTimeout(function() {
              udp_send('{"tata":"toto","message":"titi", "source": "test42", "type": "pouet", "host": "toto","@timestamp":"abc"}');
              setTimeout(function() {
                socket.close();
                agent.close(function() {
                  callback(null);
                });
              }, 200);
            }, 50);
          }, 50);
        }, 50);
      }.bind(this));
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');
      var splitted = c.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {
        '@version': '1',
        'host': '127.0.0.1',
        'udp_port': 17854,
        'message': 'toto'
      });
      helper.checkResult(splitted[1], {
        '@version': '1',
        'host': '127.0.0.1',
        'udp_port': 17854,
        'message': '{"tata":"toto","type":"titi","message":"oups"}'
      });
      helper.checkResult(splitted[2], {
        '@version': '1',
        'host': 'toto',
        'source': 'test42',
        'type': 'pouet',
        'tata': 'toto',
        'message': 'titi',
        '@timestamp': 'abc'
      }, undefined, true);
    }
  },
}, 5, 20000).export(module);
