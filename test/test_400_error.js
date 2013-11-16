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
      a.on('init_error', function(module_name, error) {
        assert.ifError(error);
      });
      a.loadUrls(urls, function(err) {
        if (err) {
          return callback(null, err.toString());
        }
        assert.fail('Init success, should not');
      }, 200);
    },

    check: function(error, message) {
      assert.ifError(error);
      assert.ok(message.match(expected_message_pattern), 'Message does not match pattern : ' + expected_message_pattern + ' : ' + message);
    }
  };
}

function check_error_module(urls, type, expected_message_pattern, expected_module_name) {
  return {
    topic: function() {
      var callback = this.callback;
      var a = agent.create();
      a.on(type, function(module_name, error) {
        console.log('Error detected, ' + module_name + ' : ' + error);
        callback(null, error.toString(), module_name);
      });
      a.on(type === 'error' ? 'init_error' : 'error', function(module_name, err) {
        assert.ifError(err);
      });
      a.loadUrls(urls, function(err) {
        assert.ifError(err);
      }, 200);
    },

    check: function(err, message, module_name) {
      assert.ifError(err);
      assert.ok(message.match(expected_message_pattern), 'Message does not match pattern : ' + expected_message_pattern + ' : ' + message);
      assert.equal(module_name, expected_module_name);
    }
  };
}

vows.describe('Integration error :').addBatch({
  'non_existent_module': check_error_init([
    'input://non_existent_module://'
  ], 'Cannot find module'),
  'wrong url': check_error_init([
    'input://non_existent_module'
  ], 'Unable to extract plugin name'),
  'wrong url init': check_error_init([
    'toto://non_existent_module://'
  ], 'Unknown protocol'),
  'wrong port in tcp module': check_error_init([
    'input://tcp://0.0.0.0:abcd'
  ], 'Unable to extract port'),
}).addBatch({
  'input_file_error : root directory not readable': check_error_module([
    'input://file:///root/toto/43input1.txt',
    'output://stdout://'
  ], 'init_error', 'Error: watch EACCES', 'input_file'),
}).addBatch({
  'wrong_output_file_module': check_error_module([
    'output://file:///path_which_does_not_exist/titi.txt'
  ], 'error', 'ENOENT', 'output_file'),
}).export(module);
