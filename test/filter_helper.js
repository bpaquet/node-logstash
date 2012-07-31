var assert = require('assert'),
    Log4Node = require('log4node');

function create(filter_name, filter_config, number_of_events, start_callback, end_callback) {
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
        start_callback(m);
      });
    },

    check: function(err, result) {
      assert.ifError(err);
      end_callback(result);
    },
  }
}

module.exports = {
  create: create,
}
