var assert = require('assert'),
    Log4Node = require('log4node');

function create(filter_name, filter_config, inputs, outputs) {
  return create_with_callback(filter_name, filter_config, inputs, outputs.length, function(r) {
    assert.deepEqual(r, outputs);
  });
}

function create_with_callback(filter_name, filter_config, inputs, number_of_events, check_callback) {
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
      m.init(new Log4Node('info'), filter_config, function(err) {
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
  create_with_callback: create_with_callback,
}
