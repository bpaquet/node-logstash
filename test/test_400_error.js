var agent = require('agent'),
    vows = require('vows-batch-retry'),
    assert = require('assert');

function check_error_init(urls, expected_message_pattern) {
  return {
    topic: function() {
      var callback = this.callback;
      var a = agent.create();
      a.on('error', function(module_name, error) {
        assert.ifError(error);
      });
      a.start(urls, function(err) {
        if (err) {
          console.log('Received error', err);
          a.close(function() {
            callback(null, err.toString());
          });
          return;
        }
        console.log('Oups, should not be there');
        assert.fail('Init success, should not');
      }, 200);
    },

    check: function(error, message) {
      console.log('test', error, message);
      assert.ifError(error);
      assert.ok(message.match(expected_message_pattern), 'Message does not match pattern : ' + expected_message_pattern + ' : ' + message);
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
    'input://http://localhost:6379'
  ], 'listen EADDRINUSE'),
}).addBatch({
  'tcp unable to open port (access)': check_error_init([
    'input://tcp://localhost:80'
  ], 'listen EACCES'),
}).addBatch({
  'tcp unable to open port (used)': check_error_init([
    'input://tcp://localhost:6379'
  ], 'listen EADDRINUSE'),
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
}).export(module);
