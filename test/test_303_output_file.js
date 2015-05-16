var vows = require('vows-batch-retry'),
  assert = require('assert'),
  fs = require('fs'),
  output_file = require('lib/outputs/output_file');

vows.describe('Output file ').addBatchRetry({
  'standard test': {
    topic: function() {
      var callback = this.callback;
      fs.mkdirSync('output');
      var p = output_file.create();
      p.init('output/toto.txt', function(err) {
        assert.ifError(err);
        p.process({message: 'line1'});
        p.process({message: 'line2'});
        p.process({message: 'line3'});
        setTimeout(function() {
          p.close(callback);
        }, 200);
      });
    },
    check: function(err) {
      assert.ifError(err);

      var content = fs.readFileSync('output/toto.txt').toString().split('\n');
      fs.unlinkSync('output/toto.txt');
      fs.rmdirSync('output');

      assert.equal(content.length, 4);
      assert.equal(content[0], 'line1');
      assert.equal(content[1], 'line2');
      assert.equal(content[2], 'line3');
      assert.equal(content[3], '');
    }
  },
}, 5, 10000).addBatchRetry({
  'use variables in file name test': {
    topic: function() {
      var callback = this.callback;
      fs.mkdirSync('output');
      var p = output_file.create();
      var e;
      p.once('error', function(err) {
        e = err;
      });
      p.init('output/toto_#{type}.txt', function(err) {
        assert.ifError(err);
        p.process({message: 'line0'});
        p.process({message: 'line1', type: 'a'});
        p.process({message: 'line2', type: 'b'});
        p.process({message: 'line3', type: 'a'});
        setTimeout(function() {
          p.close(function() {
            callback(undefined, e);
          });
        }, 500);
      });
    },
    check: function(err, e) {
      assert.ifError(err);
      assert.isDefined(e);
      assert.match(e, /Unable to compute output filename/);

      var content_a = fs.readFileSync('output/toto_a.txt').toString().split('\n');
      fs.unlinkSync('output/toto_a.txt');
      var content_b = fs.readFileSync('output/toto_b.txt').toString().split('\n');
      fs.unlinkSync('output/toto_b.txt');
      fs.rmdirSync('output');

      assert.equal(content_a.length, 3);
      assert.equal(content_a[0], 'line1');
      assert.equal(content_a[1], 'line3');
      assert.equal(content_a[2], '');

      assert.equal(content_b.length, 2);
      assert.equal(content_b[0], 'line2');
      assert.equal(content_b[1], '');
    }
  }
}, 5, 10000).addBatchRetry({
  'useless files closing': {
    topic: function() {
      var callback = this.callback;
      fs.mkdirSync('output');
      var p = output_file.create();
      p.init('output/toto.txt?delay_before_close=200', function(err) {
        assert.ifError(err);
        p.process({message: 'line1'});
        setTimeout(function() {
          assert.equal(Object.keys(p.writers).length, 1);
          setTimeout(function() {
            assert.equal(Object.keys(p.writers).length, 0);
            p.close(callback);
          }, 400);
        }, 50);
      });
    },
    check: function(err) {
      assert.ifError(err);

      var content = fs.readFileSync('output/toto.txt').toString().split('\n');
      fs.unlinkSync('output/toto.txt');
      fs.rmdirSync('output');

      assert.equal(content.length, 2);
      assert.equal(content[0], 'line1');
      assert.equal(content[1], '');
    }
  },
}, 5, 10000).addBatchRetry({
  'reopen': {
    topic: function() {
      var callback = this.callback;
      fs.mkdirSync('output');
      var p = output_file.create();
      p.init('output/toto.txt?delay_before_close=200', function(err) {
        assert.ifError(err);
        p.process({message: 'line1'});
        setTimeout(function() {
          p.reopen(function() {
            setTimeout(function() {
              p.process({message: 'line3'});
              setTimeout(function() {
                p.close(callback);
              }, 200);
            }, 100);
          });
          p.process({message: 'line2'});
        }, 100);
      });
    },
    check: function(err) {
      assert.ifError(err);

      var content = fs.readFileSync('output/toto.txt').toString().split('\n');
      fs.unlinkSync('output/toto.txt');
      fs.rmdirSync('output');

      assert.equal(content.length, 4);
      assert.equal(content[0], 'line1');
      assert.equal(content[1], 'line2');
      assert.equal(content[2], 'line3');
      assert.equal(content[3], '');
    }
  },
}, 5, 10000).addBatchRetry({
  'unable to open file': {
    topic: function() {
      var callback = this.callback;
      var e;
      fs.mkdirSync('output');
      var p = output_file.create();
      p.init('/root/toto.txt?delay_before_close=200', function(err) {
        assert.ifError(err);
        p.process({message: 'line1'});
        p.process({message: 'line2'});
        p.process({message: 'line3'});
        setTimeout(function() {
          assert.equal(Object.keys(p.writers).length, 1);
          setTimeout(function() {
            assert.equal(Object.keys(p.writers).length, 0);
            p.close(function() {
              callback(undefined, e);
            });
          }, 400);
        }, 50);
      });
      p.once('error', function(err) {
        e = err;
      });
    },
    check: function(err, e) {
      assert.ifError(err);

      assert.isDefined(e);
      assert.match(e, /EACCES/);
    }
  },
}, 5, 10000).export(module);