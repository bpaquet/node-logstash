var assert = require('assert');

function create(filter_name, filter_config, inputs, outputs) {
  return createWithCallback(filter_name, filter_config, inputs, outputs.length, function(r) {
    assert.deepEqual(r, outputs);
  });
}

function createWithCallback(filter_name, filter_config, inputs, number_of_events, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var m = require('../lib/filters/filter_' + filter_name).create();
      var result = [];
      m.on('error', function(err) {
        assert.ifError(err);
      });
      m.on('output', function(x) {
        result.push(x);
        if (result.length == number_of_events) {
          callback(null, result);
        }
      });
      m.init(filter_config, function(err) {
        assert.ifError(err);
        inputs.forEach(function(d) {
          m.emit('input', d);
        })
      });
    },

    check: function(err, result) {
      assert.ifError(err);
      check_callback(result);
    },
  }
}

module.exports = {
  create: create,
  createWithCallback: createWithCallback,
}
