var vows = require('vows-batch-retry'),
  assert = require('assert'),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  moment = require('moment'),
  fs = require('fs'),
  not_readable_helper = require('./not_readable_helper'),
  output_file = require('outputs/output_file');

vows.describe('Output file ').addBatchRetry({
  'standard test': {
    topic: function() {
      var callback = this.callback;
      mkdirp.sync('output');
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
      rimraf.sync('output');

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
      mkdirp.sync('output');
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
      var content_b = fs.readFileSync('output/toto_b.txt').toString().split('\n');
      rimraf.sync('output');

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
      mkdirp.sync('output');
      var p = output_file.create();
      p.init('output/toto.txt?idle_timeout=0.2', function(err) {
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
      rimraf.sync('output');

      assert.equal(content.length, 2);
      assert.equal(content[0], 'line1');
      assert.equal(content[1], '');
    }
  },
}, 5, 10000).addBatchRetry({
  'reopen': {
    topic: function() {
      var callback = this.callback;
      mkdirp.sync('output');
      var p = output_file.create();
      p.init('output/toto.txt?idle_timeout=0.2', function(err) {
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
      rimraf.sync('output');

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
      mkdirp.sync('output');
      not_readable_helper.create('root');
      var p = output_file.create();
      p.init('root/toto.txt?retry_delay=0.3', function(err) {
        assert.ifError(err);
        p.process({message: 'line1'});
        p.process({message: 'line2'});
        p.process({message: 'line3'});
        setTimeout(function() {
          p.process({message: 'line4'});
          assert.equal(Object.keys(p.writers).length, 1);
          setTimeout(function() {
            assert.equal(Object.keys(p.writers).length, 0);
            p.close(function() {
              callback(undefined, e);
            });
          }, 500);
        }, 50);
      });
      p.once('error', function(err) {
        e = err;
      });
    },
    check: function(err, e) {
      assert.ifError(err);

      not_readable_helper.remove('root');

      rimraf.sync('output');

      assert.isDefined(e);
      assert.match(e, /EACCES/);
    }
  },
}, 5, 10000).addBatchRetry({
  'directory test': {
    topic: function() {
      var callback = this.callback;
      mkdirp.sync('output');
      var p = output_file.create();
      p.init('output/tata/#{now:YYYY}/toto.txt', function(err) {
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

      var year = moment().format('YYYY');
      var content = fs.readFileSync('output/tata/' + year + '/toto.txt').toString().split('\n');
      rimraf.sync('output');

      assert.equal(content.length, 4);
      assert.equal(content[0], 'line1');
      assert.equal(content[1], 'line2');
      assert.equal(content[2], 'line3');
      assert.equal(content[3], '');
    }
  },
}, 5, 10000).export(module);