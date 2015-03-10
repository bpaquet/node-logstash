var vows = require('vows-batch-retry'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  spawn = require('child_process').spawn,
  directory_detector = require('lib/directory_detector');

function TestDirectoryDetector(directory, callback) {
  this.exists = [];
  this.detector = new directory_detector.DirectoryDetector();
  this.detector.on('exists', function(d) {
    this.exists.push(d);
  }.bind(this));
  this.detector.start(directory, callback);
}

function check(detector, exists) {
  assert.deepEqual(detector.exists.sort(), exists.sort());
}

function create_test(directory, start_callback, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var detector = new TestDirectoryDetector(directory, function(err) {
        if (err) {
          return callback(err);
        }
        start_callback(function(detector2) {
          detector.detector.close(function(err) {
            callback(err, detector, detector2);
          });
        }, detector);
      });
    },

    check: function(err, detector, detector2) {
      assert.ifError(err);
      check_callback(detector, detector2);
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
    check(detector, [path.resolve('.')]);
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
  'directory does not exists at startup, parent not readable': create_test_init_failed('/root/toto87/uio', 'EACCES'),
}, 5, 10000).addBatchRetry({
  '1 subdirectory': create_test(path.resolve('.') + '/toto44', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      fs.mkdir('toto44', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          callback();
        }, 50);
      });
    }, 50);
  }, function(detector) {
    fs.rmdirSync('toto44');
    check(detector, [path.resolve('.') + '/toto44']);
  }),
}, 5, 10000).addBatchRetry({
  '2 subdirectory, file manipulation': create_test(path.resolve('.') + '/toto48/yuo', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
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
                  check(detector, []);
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
    check(detector, [path.resolve('.') + '/toto48/yuo']);
  }),
}, 5, 10000).addBatchRetry({
  '4 subdirectory': create_test(path.resolve('.') + '/toto45/12/45/87', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
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
    check(detector, [path.resolve('.') + '/toto45/12/45/87']);
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
    fs.rmdirSync('toto49/12/45/87');
    fs.rmdirSync('toto49/12/45');
    fs.rmdirSync('toto49/12');
    fs.rmdirSync('toto49');
    check(detector, [path.resolve('.') + '/toto49/12/45/87']);
  }),
}, 5, 10000).addBatchRetry({
  'using filter': create_test(path.resolve('.') + '/toto45/1*/45', function(callback, detector) {
    setTimeout(function() {
      check(detector, []);
      fs.mkdir('toto45', function(err) {
        assert.ifError(err);
        fs.mkdir('toto45/12', function(err) {
          assert.ifError(err);
          fs.mkdir('toto45/13', function(err) {
            assert.ifError(err);
            fs.mkdir('toto45/20', function(err) {
              assert.ifError(err);
              fs.mkdir('toto45/12/45', function(err) {
                assert.ifError(err);
                fs.mkdir('toto45/13/45', function(err) {
                  assert.ifError(err);
                  fs.mkdir('toto45/13/46', function(err) {
                    assert.ifError(err);
                    fs.mkdir('toto45/20/45', function(err) {
                      assert.ifError(err);
                      setTimeout(function() {
                        var detector2 = new TestDirectoryDetector(path.resolve('.') + '/toto45/1*/45', function(err) {
                          assert.ifError(err);
                          setTimeout(function() {
                            detector2.detector.close(function(err) {
                              assert.ifError(err);
                              callback(detector2);
                            });
                          }, 100);
                        });
                      }, 50);
                    });
                  });
                });
              });
            });
          });
        });
      });
    }, 50);
  }, function(detector, detector2) {
    fs.rmdirSync('toto45/12/45');
    fs.rmdirSync('toto45/12');
    fs.rmdirSync('toto45/13/45');
    fs.rmdirSync('toto45/13/46');
    fs.rmdirSync('toto45/13');
    fs.rmdirSync('toto45/20/45');
    fs.rmdirSync('toto45/20');
    fs.rmdirSync('toto45');
    check(detector, [path.resolve('.') + '/toto45/12/45', path.resolve('.') + '/toto45/13/45']);
    // console.log(detector2.exists);
    check(detector2, [path.resolve('.') + '/toto45/12/45', path.resolve('.') + '/toto45/13/45']);
  }),
}, 5, 10000).export(module);
