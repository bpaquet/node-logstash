var vows = require('vows-batch-retry'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  spawn = require('child_process').spawn,
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  not_readable_helper = require('./not_readable_helper'),
  directory_detector = require('lib/directory_detector');

function TestDirectoryDetector(directory, callback) {
  this.exists = [];
  this.errors = [];
  this.removed = [];
  this.detector = new directory_detector.DirectoryDetector();
  this.detector.on('exists', function(d, newly_created) {
    this.exists.push(d);
    this.exists.push(newly_created);
  }.bind(this));
  this.detector.on('removed', function(d) {
    this.removed.push(d);
  }.bind(this));
  this.detector.on('error', function(err) {
    this.errors.push(err);
  }.bind(this));
  this.detector.start(directory, callback);
}

function check(detector, exists, removed) {
  assert.equal(detector.errors.length, 0);
  assert.deepEqual(detector.exists.sort(), exists.sort());
  assert.deepEqual(detector.removed, removed || []);
}

function create_test(directory, start_callback, check_callback) {
  return {
    topic: function() {
      not_readable_helper.create('root');
      var callback = this.callback;
      var already = false;
      var detector = new TestDirectoryDetector(directory, function() {
        assert.isFalse(already);
        already = true;
        start_callback(function(detector2) {
          detector.detector.close(function(err) {
            callback(err, detector, detector2);
          });
        }, detector);
      });
    },

    check: function(err, detector, detector2) {
      assert.ifError(err);
      not_readable_helper.remove('root');
      check_callback(detector, detector2);
    }
  };
}

function create_test_init_failed(directory, pattern) {
  return {
    topic: function() {
      not_readable_helper.create('root');
      var callback = this.callback;
      var start_called = false;
      var detector = new directory_detector.DirectoryDetector();
      detector.on('error', function(err) {
        assert.isDefined(err);
        assert.match(err.toString(), new RegExp(pattern));
        callback(null, start_called);
      });
      detector.start(directory, function() {
        start_called = true;
      });
    },

    check: function(err, start_called) {
      assert.ifError(err);
      not_readable_helper.remove('root');
      assert.isFalse(start_called);
    }
  };
}

vows.describe('Directory detector ').addBatchRetry({
  'current directory exists': create_test(path.resolve('.'), function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, [path.resolve('.'), false]);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup': create_test(path.resolve('.') + '/toto32', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, []);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup, parent = /': create_test('/toto32', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, []);
  }),
}, 5, 10000).addBatchRetry({
  'strange directory name': create_test('//////toto56', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, []);
  }),
}, 5, 10000).addBatchRetry({
  'strange directory name 2': create_test('/#&toto56', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, []);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup, parent not readable': create_test_init_failed('root/toto87/uio', 'EACCES'),
}, 5, 10000).addBatchRetry({
  '1 subdirectory': create_test(path.resolve('.') + '/toto44', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      mkdirp('toto44', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          callback();
        }, 50);
      });
    }, 50);
  }, function(detector) {
    rimraf.sync('toto44');
    check(detector, [path.resolve('.') + '/toto44', true]);
  }),
}, 5, 10000).addBatchRetry({
  '2 subdirectory, file manipulation': create_test(path.resolve('.') + '/toto48/yuo', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      mkdirp('toto48', function(err) {
        assert.ifError(err);
        fs.writeFile('toto48/tito', 'content', function(err) {
          assert.ifError(err);
          fs.unlink('toto48/tito', function(err) {
            assert.ifError(err);
            mkdirp('toto48/truc', function(err) {
              assert.ifError(err);
              rimraf('toto48/truc', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  check(detector, []);
                  mkdirp('toto48/yuo', function() {
                    setTimeout(function() {
                      callback();
                    }, 50);
                  });
                }, 50);
              });
            });
          });
        });
      });
    }, 50);
  }, function(detector) {
    rimraf.sync('toto48');
    check(detector, [path.resolve('.') + '/toto48/yuo', true]);
  }),
}, 5, 10000).addBatchRetry({
  '4 subdirectory': create_test(path.resolve('.') + '/toto45/12/45/87', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      mkdirp('toto45', function(err) {
        assert.ifError(err);
        mkdirp('toto45/12', function(err) {
          assert.ifError(err);
          mkdirp('toto45/12/45', function(err) {
            assert.ifError(err);
            mkdirp('toto45/12/45/87', function(err) {
              assert.ifError(err);
              setTimeout(function() {
                callback();
              }, 50);
            });
          });
        });
      });
    }, 50);
  }, function(detector) {
    rimraf.sync('toto45');
    check(detector, [path.resolve('.') + '/toto45/12/45/87', true]);
  }),
}, 5, 10000).addBatchRetry({
  '4 subdirectory mkdir -p': create_test(path.resolve('.') + '/toto49/12/45/87', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      var child = spawn('mkdir', ['-p', 'toto49/12/45/87']);
      child.on('exit', function(exit_code) {
        assert.equal(0, exit_code);
        setTimeout(function() {
          callback();
        }, 50);
      });
    }, 50);
  }, function(detector) {
    rimraf.sync('toto49');
    check(detector, [path.resolve('.') + '/toto49/12/45/87', true]);
  }),
}, 5, 10000).addBatchRetry({
  'using filter': create_test(path.resolve('.') + '/toto45/1*/45', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      mkdirp('toto45/12/45', function(err) {
        assert.ifError(err);
        mkdirp('toto45/13/45', function(err) {
          assert.ifError(err);
          mkdirp('toto45/20/45', function(err) {
            assert.ifError(err);
            mkdirp('toto45/13/46', function(err) {
              assert.ifError(err);
              setTimeout(function() {
                var detector2 = new TestDirectoryDetector(path.resolve('.') + '/toto45/1*/45', function(err) {
                  assert.ifError(err);
                });
                setTimeout(function() {
                  detector2.detector.close(function(err) {
                    assert.ifError(err);
                    callback(detector2);
                  });
                }, 100);
              }, 50);
            });
          });
        });
      });
    }, 50);
  }, function(detector, detector2) {
    rimraf.sync('toto45');
    check(detector, [path.resolve('.') + '/toto45/12/45', true, path.resolve('.') + '/toto45/13/45', true]);
    check(detector2, [path.resolve('.') + '/toto45/12/45', true, path.resolve('.') + '/toto45/13/45', true]);
  }),
}, 5, 10000).addBatchRetry({
  '2 subdirectory, create and removed': create_test(path.resolve('.') + '/toto44/t*', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      mkdirp('toto44/titi', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          check(detector, [path.resolve('.') + '/toto44/titi', true]);
          rimraf('toto44', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              callback();
            }, 50);
          });
        }, 50);
      });
    }, 50);
  }, function(detector) {
    assert.deepEqual(detector.exists, [path.resolve('.') + '/toto44/titi', true], [path.resolve('.') + '/toto44/titi']);
  }),
}, 5, 10000).export(module);
