var vows = require('vows-batch-retry'),
    assert = require('assert'),
    fs = require('fs');
    path = require('path'),
    spawn = require('child_process').spawn,
    directory_detector = require('../lib/lib/directory_detector');

function TestDirectoryDetector(directory) {
  this.exists = 0;
  this.not_exists = 0;
  this.errors = [];
  this.detector = new directory_detector.DirectoryDetector;
  this.detector.on('exists', function() {
    this.exists += 1;
  }.bind(this));
  this.detector.on('not_exists', function() {
    this.not_exists += 1;
  }.bind(this));
  this.detector.on('error', function(err) {
    this.errors.push(err);
  }.bind(this));
  this.detector.start(directory);
}

function check(detector, exists, not_exists, errors) {
  assert.equal(exists, detector.exists, "Wrong number of exists events");
  assert.equal(not_exists, detector.not_exists, "Wrong number of not exists events")
  assert.equal(errors, detector.errors.length, "Wrong number of errors");
}

function create_test(directory, start_callback, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var detector = new TestDirectoryDetector(directory);
      start_callback(function() {
        callback(null, detector);
      }, detector);
    },

    check: function(err, detector) {
      assert.ifError(err);
      detector.detector.close();
      check_callback(detector);
    }
  }
}

vows.describe('Directory detector ').addBatchRetry({
  'current directory exists': create_test(path.resolve('.'), function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 1, 0, 0);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup': create_test(path.resolve('.') + '/toto32', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup, parent = /': create_test('/toto32', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  'strange directory name': create_test('//////toto56', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  'strange directory name 2': create_test('/#&toto56', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  'directory does not exists at startup, parent not readable': create_test('/root/toto87/uio', function(callback) {
    setTimeout(function() {
      callback();
    }, 50);
  }, function(detector) {
    check(detector, 0, 1, 1);
    console.log(detector.errors);
    assert(detector.errors[0].toString().match(/EACCES/), detector.errors[0].toString() + " should contain EACCESS");
  }),
}, 5, 10000).addBatchRetry({
  '1 subdirectory': create_test(path.resolve('.') + '/toto44', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1, 0);
      fs.mkdir('toto44', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          callback();
        }, 50);
      });
    }, 50);
  }, function(detector) {
    fs.rmdirSync('toto44');
    check(detector, 1, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  '2 subdirectory, file manipulation': create_test(path.resolve('.') + '/toto48/yuo', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1, 0);
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
                  check(detector, 0, 1, 0);
                  fs.mkdir('toto48/yuo', function(err) {
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
    check(detector, 1, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  '4 subdirectory': create_test(path.resolve('.') + '/toto45/12/45/87', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1, 0);
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
    check(detector, 1, 1, 0);
  }),
}, 5, 10000).addBatchRetry({
  '4 subdirectory mkdir -p': create_test(path.resolve('.') + '/toto49/12/45/87', function(callback, detector) {
    setTimeout(function() {
      check(detector, 0, 1, 0);
      child = spawn('mkdir', ['-p', 'toto49/12/45/87']);
      child.on('exit', function(exit_code) {
        assert.equal(0, exit_code);
        setTimeout(function() {
          callback();
        }, 50);
      })
    }, 50);
  }, function(detector) {
    fs.rmdirSync('toto49/12/45/87');
    fs.rmdirSync('toto49/12/45');
    fs.rmdirSync('toto49/12');
    fs.rmdirSync('toto49');
    check(detector, 1, 1, 0);
  }),
}, 5, 10000).export(module);
