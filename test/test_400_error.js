var agent = require('agent'),
  vows = require('vows-batch-retry'),
  redis_driver = require('redis_driver'),
  assert = require('assert');

function check_error_init(urls, expected_message_pattern, start_callback, stop_callback) {
  return {
    topic: function() {
      start_callback = start_callback || function(callback) {
        callback(undefined);
      };
      stop_callback = stop_callback || function(o, callback) {
        callback();
      };
      var callback = this.callback;
      start_callback(function(o) {
        var a = agent.create();
        a.on('error', function(module_name, error) {
          assert.ifError(error);
        });
        a.start(urls, function(err) {
          if (err) {
            a.close(function() {
              stop_callback(o, function() {
                callback(null, err.toString());
              });
            });
            return;
          }
          stop_callback(o, function() {
            assert.fail('Init success, should not');
          });
        }, 200);
      });
    },

    check: function(error, message) {
      assert.ifError(error);
      assert.match(message, new RegExp(expected_message_pattern));
    }
  };
}

vows.describe('Integration error :').addBatch({
  'non_existent_module': check_error_init([
    'input://non_existent_module://'
  ], 'Cannot find module'),
}).addBatch({
  'wrong url': check_error_init([
    'input://non_existent_module'
  ], 'Unable to extract plugin name'),
}).addBatch({
  'wrong url init': check_error_init([
    'toto://non_existent_module://'
  ], 'Unknown protocol'),
}).addBatch({
  'wrong port in tcp module': check_error_init([
    'input://tcp://0.0.0.0:abcd'
  ], 'Unable to extract port'),
}).addBatch({
  'filter regex : missing pattern file': check_error_init([
    'filter://regex://toto2'
  ], 'Unable to load pattern : toto2'),
}).addBatch({
  'output statd : missing metric value with metric counter': check_error_init([
    'output://statsd://localhost:12345?metric_key=a&metric_type=counter'
  ], 'ou have to specify metric_value with metric_type counter'),
}).addBatch({
  'output statd : missing metric value with metric timer': check_error_init([
    'output://statsd://localhost:12345?metric_key=a&metric_type=timer'
  ], 'You have to specify metric_value with metric_type timer'),
}).addBatch({
  'output statd : missing metric value with metric gauge': check_error_init([
    'output://statsd://localhost:12345?metric_key=a&metric_type=gauge'
  ], 'You have to specify metric_value with metric_type gauge'),
}).addBatch({
  'output statd : wrong metric type': check_error_init([
    'output://statsd://localhost:12345?metric_key=a&metric_type=toto'
  ], 'Wrong metric_type: toto'),
}).addBatch({
  'input_file_error : root directory not readable': check_error_init([
    'input://file:///root/toto/43input1.txt',
    'output://stdout://'
  ], 'Error: watch EACCES'),
}).addBatch({
  'wrong_output_file_module': check_error_init([
    'output://file:///path_which_does_not_exist/titi.txt'
  ], 'ENOENT'),
}).addBatch({
  'http unable to open port (access)': check_error_init([
    'input://http://localhost:80'
  ], 'listen EACCES'),
}).addBatch({
  'http unable to open port (used)': check_error_init([
    'input://http://localhost:17874'
  ], 'listen EADDRINUSE', function(callback) {
    var r = new redis_driver.RedisDriver();
    r.start({
      port: 17874
    }, function() {
      callback(r);
    });
  }, function(r, callback) {
    r.stop(callback);
  }),
}).addBatch({
  'tcp unable to open port (access)': check_error_init([
    'input://tcp://localhost:80'
  ], 'listen EACCES'),
}).addBatch({
  'tcp unable to open port (used)': check_error_init([
    'input://tcp://localhost:17874'
  ], 'listen EADDRINUSE', function(callback) {
    var r = new redis_driver.RedisDriver();
    r.start({
      port: 17874
    }, function() {
      callback(r);
    });
  }, function(r, callback) {
    r.stop(callback);
  }),
}).addBatch({
  'udp unable to open port (access)': check_error_init([
    'input://udp://localhost:123'
  ], 'bind EACCES'),
}).addBatch({
  'unix unable to open file': check_error_init([
    'input://unix:///root/toto'
  ], 'listen EACCES'),
}).addBatch({
  'zeromq unable to open': check_error_init([
    'input://zeromq://tcp://0.0.0.0:22'
  ], 'Permission denied'),
}).addBatch({
  'wrong serializer': check_error_init([
    'output://tcp://localhost:12345?serializer=non_existent'
  ], 'Unknown serializer non_existent'),
}).addBatch({
  'wrong redis input config': check_error_init([
    'input://redis://localhost:6379?method=toto&channel=titi'
  ], 'Wrong method'),
}).addBatch({
  'wrong redis input queue config': check_error_init([
    'input://redis://localhost:6379?method=queue&channel=titi'
  ], 'You have to specify the key parameter in queue mode'),
}).addBatch({
  'wrong redis input pubsub config': check_error_init([
    'input://redis://localhost:6379?method=pubsub'
  ], 'You have to specify the channel parameter in pubsub mode'),
}).addBatch({
  'wrong redis output config': check_error_init([
    'output://redis://localhost:6379?method=toto&channel=titi'
  ], 'Wrong method'),
}).addBatch({
  'wrong redis output queue config': check_error_init([
    'output://redis://localhost:6379?method=queue&channel=titi'
  ], 'You have to specify the key parameter in queue mode'),
}).addBatch({
  'wrong redis output pubsub config': check_error_init([
    'output://redis://localhost:6379?method=pubsub&key=toto'
  ], 'You have to specify the channel parameter in pubsub mode'),
}).addBatch({
  'wrong grok pattern': check_error_init([
    'filter://grok://?grok=%{GROKTEST}'
  ], 'Unable to find grok pattern GROKTEST'),
}).addBatch({
  'wrong grok pattern recurse': check_error_init([
    'filter://grok://?grok=%{GROKTEST2}&extra_patterns_file=' + __dirname + '/grok/extra'
  ], 'Unable to find grok pattern NUMBER98'),
}).addBatch({
  'unexistent grok pattern file': check_error_init([
    'filter://grok://?grok=%{GROKTEST}&extra_patterns_file=/tmp/titi'
  ], 'Error'),
  'wrong pattern file': check_error_init([
    'filter://grok://?grok=%{GROKTEST}&extra_patterns_file=' + __dirname + '/grok/wrong'
  ], 'Unable to find grok pattern GROKTEST'),
}).export(module);
