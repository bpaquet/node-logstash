var vows = require('vows'),
    assert = require('assert'),
    events = require('events');
    error_buffer = require('error_buffer');

vows.describe('Error buffer').addBatch({
  'standard check': {
    topic: function() {
      var callback = this.callback;
      var errors = [];
      var e = new events.EventEmitter();
      var b = error_buffer.create('my name', 250, e);
      e.on('error', function(err) {
        errors.push(err);
      });
      for(var i = 0; i < 1000; i ++) {
        setTimeout(function() {
          b.emit('error', 'toto');
        }, 600 * i / 1000);
      }
      setTimeout(function() {
        b.emit('ok', 'toto');
        b.emit('ok', 'toto');
        b.emit('ok', 'toto');
      }, 700);
      setTimeout(function() {
        callback(undefined, errors);
      }, 1200);
    },
    check: function(errors) {
      assert.deepEqual(errors, ['my name start failing: toto', 'my name still failing.', 'my name still failing.', 'my name is back to normal.']);
    }
  }
}).export(module);
