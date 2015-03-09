var vows = require('vows-batch-retry'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  spawn = require('child_process').spawn,
  directory_detector = require('lib/directory_detector');

function TestDirectoryDetector(directory, callback) {
  this.exists = 0;
  this.not_exists = 0;
  this.detector = new directory_detector.DirectoryDetector();
  this.detector.on('exists', function() {
    this.exists += 1;
  }.bind(this));
  this.detector.on('not_exists', function() {
    this.not_exists += 1;
  }.bind(this));
  this.detector.start(directory, callback);
}

function check(detector, exists, not_exists) {
  assert.equal(exists, detector.exists, 'Wrong number of exists events');
  assert.equal(not_exists, detector.not_exists, 'Wrong number of not exists events');
}

function create_test(directory, start_callback, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var detector = new TestDirectoryDetector(directory, function(err) {
        if (err) {
          return callback(err);
        }
        start_callback(function() {
          detector.detector.close(function(err) {
            callback(err, detector);
          });
        }, detector);
      });
    },

    check: function(err, detector) {
      assert.ifError(err);
      check_callback(detector);
    }
  };
}

function create_test_init_failed(directory, pattern) {
  return {
    topic: function() {
      var callback = this.callback;
      var detector = new directory_detector.DirectoryDetector();
      detector.start(directory, function(err) {
        assert.isDefined(err);
        assert.match(err.toString(), new RegExp(pattern));
        callback(null);
      });
    },

    check: function(err) {
      assert.ifError(err);
    }
  };
}

vows.describe('Directory detector ').addBatchRetry({
  'current directory exists': create_test(path.resolve('.'), function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup': create_test(path.resolve('.') + '/toto32', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup, parent = /': create_test('/toto32', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1);
  }),
}, 5, 10000).addBatchRetry({
  'strange directory name': create_test('//////toto56', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1);
  }),
}, 5, 10000).addBatchRetry({
  'strange directory name 2': create_test('/#&toto56', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup, parent not readable': create_test_init_failed('/root/toto87/uio', 'EACCES'),
}, 5, 10000).addBatchRetry({
  '1 subdirectory': create_test(path.resolve('.') + '/toto44', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1);
      fs.mkdir('toto44', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          callback();
        }, 50);
      });
    }, 50);
  }, function(detector) {
    fs.rmdirSync('toto44');
    check(detector, 1, 1);
  }),
}, 5, 10000).addBatchRetry({
  '2 subdirectory, file manipulation': create_test(path.resolve('.') + '/toto48/yuo', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1);
      fs.mkdir('toto48', function(err) {
        assert.ifError(err);
        fs.writeFile('toto48/tito', 'content', function(err) {
          assert.ifError(err);
          fs.unlink('toto48/tito', function(err) {
            assert.ifError(err);
            fs.mkdir('toto48/truc', function(err) {
              assert.ifError(err);
              fs.rmdir('toto48/truc', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  check(detector, 0, 1);
                  fs.mkdir('toto48/yuo', function() {
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
    fs.rmdirSync('toto48/yuo');
    fs.rmdirSync('toto48');
    check(detector, 1, 1);
  }),
}, 5, 10000).addBatchRetry({
  '4 subdirectory': create_test(path.resolve('.') + '/toto45/12/45/87', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1);
      fs.mkdir('toto45', function(err) {
        assert.ifError(err);
        fs.mkdir('toto45/12', function(err) {
          assert.ifError(err);
          fs.mkdir('toto45/12/45', function(err) {
            assert.ifError(err);
            fs.mkdir('toto45/12/45/87', function(err) {
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
    fs.rmdirSync('toto45/12/45/87');
    fs.rmdirSync('toto45/12/45');
    fs.rmdirSync('toto45/12');
    fs.rmdirSync('toto45');
    check(detector, 1, 1);
  }),
}, 5, 10000).addBatchRetry({
  '4 subdirectory mkdir -p': create_test(path.resolve('.') + '/toto49/12/45/87', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1);
      var child = spawn('mkdir', ['-p', 'toto49/12/45/87']);
      child.on('exit', function(exit_code) {
        assert.equal(0, exit_code);
        setTimeout(function() {
          callback();
        }, 50);
      });
    }, 50);
  }, function(detector) {
    fs.rmdirSync('toto49/12/45/87');
    fs.rmdirSync('toto49/12/45');
    fs.rmdirSync('toto49/12');
    fs.rmdirSync('toto49');
    check(detector, 1, 1);
  }),
}, 5, 10000).export(module);
