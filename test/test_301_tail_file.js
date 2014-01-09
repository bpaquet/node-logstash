var vows = require('vows-batch-retry'),
  assert = require('assert'),
  os = require('os'),
  fs = require('fs'),
  path = require('path'),
  log = require('log4node'),
  tail = require('lib/tail_file');

function randomFile(pathname) {
  return path.join(pathname || os.tmpDir(), '___node-logstash_test___' + Math.random());
}

function TestMonitor(file, options) {
  this.file = file;
  this.lines = [];
  this.errors = [];
  this.changed_counter = 0;
  this.renamed_counter = 0;
  this.closed_counter = 0;
  this.monitor = tail.tail(this.file, options);
  this.monitor.on('data', function(data) {
    this.lines.push(data);
  }.bind(this));
  this.monitor.on('error', function(err) {
    log.error(err);
    this.errors.push(err);
  }.bind(this));
}

function create_test(start_callback, check_callback, path, options) {
  return {
    topic: function() {
      var m = new TestMonitor(randomFile(path), options);
      var callback = this.callback;
      start_callback(m, function(err) {
        m.monitor.close(function() {
          callback(err, m);
        });
      });
    },

    check: function(err, m) {
      assert.ifError(err);
      check_callback(m);
    }
  };
}

function no_error(m) {
  assert.equal(m.errors.length, 0);
}

vows.describe('Monitor ').addBatch({
  'Not existent file': create_test(function(m, callback) {
    m.monitor.start(callback);
  }, function(m) {
    no_error(m);
    assert.equal(m.lines.length, 0);
  }),
}).addBatch({
  'Empty file': create_test(function(m, callback) {
    fs.writeFileSync(m.file, '');
    m.monitor.start(callback);
  }, function(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.equal(m.lines.length, 0);
  }),
}).addBatch({
  'Not empty file start': create_test(function(m, callback) {
    fs.writeFileSync(m.file, 'line1\nline2\n');
    m.monitor.start(callback);
  }, function(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.equal(m.lines.length, 0);
  }),
}).addBatch({
  'Not empty file start, but start_index': create_test(function(m, callback) {
    fs.writeFileSync(m.file, 'line1\nline2\n');
    m.monitor.start(callback, 0);
  }, function(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.equal(m.lines.length, 2);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File filled after start': create_test(function(m, callback) {
    fs.writeFileSync(m.file, '');
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.appendFileSync(m.file, 'line1\nline2\n');
      setTimeout(callback, 500);
    });
  }, function(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File created after start': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.writeFileSync(m.file, 'line1\nline2\n');
      setTimeout(callback, 200);
    });
  }, function check(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File created after start, filled with append': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.appendFileSync(m.file, 'line1\n');
      setTimeout(function() {
        fs.appendFileSync(m.file, 'line2\n');
        setTimeout(callback, 1000);
      }, 200);
    });
  }, function(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File created after start, filled with append async': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.appendFile(m.file, 'line1\n', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          fs.appendFile(m.file, 'line2\n', function(err) {
            assert.ifError(err);
            setTimeout(callback, 1000);
          });
        }, 200);
      });
    });
  }, function(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File removed': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.writeFileSync(m.file, 'line1\nline2\n');
      setTimeout(function() {
        fs.unlinkSync(m.file);
        setTimeout(callback, 200);
      }, 200);
    });
  }, function check(m) {
    assert.equal(m.monitor.fdTailer, undefined);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File removed and recreated, second file is not read': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.writeFileSync(m.file, 'line1\nline2\n');
      setTimeout(function() {
        fs.unlinkSync(m.file);
        setTimeout(function() {
          fs.writeFileSync(m.file, 'line3\n');
          setTimeout(callback, 200);
        }, 200);
      }, 200);
    });
  }, function check(m) {
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }, undefined, {
    wait_delay_after_renaming: 100
  }),
}).addBatchRetry({
  'Double monitoring same directory': {
    topic: function() {
      var callback = this.callback;
      var m1 = new TestMonitor(randomFile());
      var m2 = new TestMonitor(randomFile());
      m1.monitor.start(function(err) {
        assert.ifError(err);
        m2.monitor.start(function(err) {
          assert.ifError(err);
          fs.appendFileSync(m1.file, 'line1\n');
          setTimeout(function() {
            fs.appendFileSync(m2.file, 'line10\n');
            setTimeout(function() {
              fs.appendFileSync(m1.file, 'line2\n');
              setTimeout(function() {
                m1.monitor.close(function() {
                  m2.monitor.close(function() {
                    callback(undefined, m1, m2);
                  });
                });
              }, 200);
            }, 200);
          });
        });
      });
    },

    check: function(err, m1, m2) {
      assert.ifError(err);
      fs.unlinkSync(m1.file);
      fs.unlinkSync(m2.file);
      no_error(m1);
      no_error(m2);
      assert.deepEqual(m1.lines, ['line1', 'line2']);
      assert.deepEqual(m2.lines, ['line10']);
    }
  }
}, 5, 10000).addBatch({
  'Wrong file path': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.isDefined(err);
      callback();
    });
  }, function check(m) {
    no_error(m);
    assert.equal(m.lines.length, 0);
  }, '/toto_does_not_exists/toto.log'),
}).export(module);
