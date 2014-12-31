var vows = require('vows'),
  assert = require('assert'),
  events = require('events'),
  error_buffer = require('lib/error_buffer');

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
      var count = 0;
      var i = setInterval(function() {
        b.emit('error', 'toto');
        count += 1;
        if (count === 500) {
          clearInterval(i);
          setTimeout(function() {
            b.emit('ok', 'toto');
            b.emit('ok', 'toto');
            b.emit('ok', 'toto');
            setTimeout(function() {
              callback(undefined, errors);
            }, 200);
          }, 200);
        }
      }, 1);
    },
    check: function(errors) {
      assert.equal(errors[0], 'my name start failing: toto');
      assert.equal(errors[errors.length - 1], 'my name is back to normal.');
      for(var i = 1; i < errors.length - 2; i ++) {
        assert.equal(errors[i], 'my name still failing.');
      }
    }
  }
}).export(module);
