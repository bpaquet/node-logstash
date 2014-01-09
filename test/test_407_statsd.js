var vows = require('vows-batch-retry'),
  fs = require('fs'),
  dgram = require('dgram'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration statsd :').addBatchRetry({
  'file2statsd': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var received = [];
      var statsd = dgram.createSocket('udp4');
      statsd.on('message', function(d) {
        received.push(d.toString());
      });
      statsd.bind(17874);
      helper.createAgent([
        'input://file://input1.txt',
        'input://file://input2.txt?type=titi',
        'input://file://input3.txt?type=tata',
        'input://file://input4.txt?type=tete',
        'input://file://input5.txt?type=toto',
        'filter://regex://?regex=^45_(.*)$&fields=my_field',
        'output://statsd://127.0.0.1:17874?metric_type=increment&metric_key=toto.bouh',
        'output://statsd://127.0.0.1:17874?metric_type=decrement&metric_key=toto.#{message}&only_type=titi',
        'output://statsd://127.0.0.1:17874?metric_type=counter&metric_key=toto.counter&metric_value=#{message}&only_type=tata',
        'output://statsd://127.0.0.1:17874?metric_type=timer&metric_key=toto.#{my_field}.#{my_field}&metric_value=20&only_type=tete',
        'output://statsd://127.0.0.1:17874?metric_type=gauge&metric_key=toto.gauge&metric_value=45&only_type=toto',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', 'line1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile('input2.txt', 'line2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  fs.appendFile('input3.txt', '10\n', function(err) {
                    assert.ifError(err);
                    setTimeout(function() {
                      fs.appendFile('input4.txt', '45_123\n', function(err) {
                        assert.ifError(err);
                        setTimeout(function() {
                          fs.appendFile('input5.txt', 'line3\n', function(err) {
                            assert.ifError(err);
                            setTimeout(function() {
                              agent.close(function() {
                                statsd.close();
                                callback(undefined, received);
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
        }, 200);
      });
    },

    check: function(err, data) {
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('input3.txt');
      fs.unlinkSync('input4.txt');
      fs.unlinkSync('input5.txt');
      assert.ifError(err);
      assert.deepEqual(data.sort(), [
        'toto.bouh:1|c',
        'toto.line2:-1|c',
        'toto.bouh:1|c',
        'toto.counter:10|c',
        'toto.bouh:1|c',
        'toto.123.123:20|ms',
        'toto.bouh:1|c',
        'toto.bouh:1|c',
        'toto.gauge:45|g',
      ].sort());
    }
  },
}, 5, 20000).addBatchRetry({
  'file2statsd_missing_field': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var received = [];
      var errors = [];
      var statsd = dgram.createSocket('udp4');
      statsd.on('message', function(d) {
        received.push(d.toString());
      });
      statsd.bind(17874);
      helper.createAgent([
        'input://file://input1.txt',
        'filter://regex://?regex=(line2)&fields=unknown_field',
        'output://statsd://127.0.0.1:17874?metric_type=increment&metric_key=toto.bouh.#{unknown_field}',
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', 'line1\n', function(err) {
            assert.ifError(err);
            fs.appendFile('input1.txt', 'line2\n', function(err) {
              assert.ifError(err);
              setTimeout(function() {
                agent.close(function() {
                  statsd.close();
                  callback(errors, received);
                });
              }, 200);
            });
          });
        }, 200);
      }, function(error) {
        errors.push(error);
      });
    },

    check: function(errors, data) {
      fs.unlinkSync('input1.txt');
      assert.deepEqual(data.sort(), ['toto.bouh.line2:1|c'].sort());
      assert.equal(errors.length, 0);
    }
  },
}, 5, 20000).export(module);
