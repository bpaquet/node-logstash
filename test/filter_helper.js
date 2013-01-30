var assert = require('assert');

function create(filter_name, filter_config, inputs, outputs, check_callback, init_callback, end_callback) {
  return createWithCallback(filter_name, filter_config, inputs, outputs.length, function(r) {
    assert.deepEqual(r, outputs);
    if (check_callback) {
      check_callback(r);
    }
  }, init_callback, end_callback);
}

exports.create = create;

function createWithCallback(filter_name, filter_config, inputs, number_of_events, check_callback, init_callback, end_callback) {
  var test = {
    topic: function() {
      var callback = this.callback;
      if (!init_callback) {
        init_callback = function(callback) {callback()};
      } 
      init_callback(function() {
        var m = require('../lib/filters/filter_' + filter_name).create();
        var result = [];
        m.on('error', function(err) {
          assert.ifError(err);
        });
        m.on('init_error', function(err) {
          assert.ifError(err);
        });
        m.on('output', function(x) {
          result.push(x);
          if (result.length == number_of_events) {
            m.close(function() {
              callback(null, result);
            });
          }
        });
        m.once('init_ok', function() {
          inputs.forEach(function(d) {
            m.emit('input', d);
          });
        });
        m.init(filter_config);
      });
    },

    check: function(err, result) {
      assert.ifError(err);
      check_callback(result);
    },
  }
  if (end_callback) {
    test.end = end_callback;
  }
  return test;
}

exports.createWithCallback = createWithCallback;
