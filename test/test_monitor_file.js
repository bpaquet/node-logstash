var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    fs = require('fs');
    monitor_file = require('monitor_file');

function LocalMonitor(start_index) {
  this.file = os.tmpDir() + "___node-logstash_test___" + Math.random();
  this.errors = [];
  this.lines = [];
  this.monitor = monitor_file.monitor(this.file, function(err) {
    this.errors.push(err);
  }.bind(this),
  function(line) {
    this.lines.push(line);
  }.bind(this), {log_level: 'warning'});
}

function create_test(start_callback, check_callback) {
  return {
    topic: function() {
      var m = new LocalMonitor();
      var callback = this.callback;
      start_callback(m, function() {
        callback(null, m);
      });
    },

    check: function(m) {
      check_callback(m);
    }
  }
}
vows.describe('Monitor ').addBatch({

  'Not existent file': create_test(function(m, callback) {
    m.monitor.start();
    setTimeout(callback, 200);
    }, function check(m) {
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 0);
    }
  ),

  'Empty file': create_test(function(m, callback) {
    fs.writeFileSync(m.file, "");
    m.monitor.start();
    setTimeout(callback, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 0);
    }
  ),

  'Not empty file start index undefined': create_test(function(m, callback) {
    fs.writeFileSync(m.file, "line1\nline2\n");
    m.monitor.start();
    setTimeout(callback, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 0);
    }
  ),

  'Not empty file start index 0': create_test(function(m, callback) {
    fs.writeFileSync(m.file, "line1\nline2\n");
    m.monitor.start(0);
    setTimeout(callback, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 2);
      assert.equal(m.lines[0], "line1");
      assert.equal(m.lines[1], "line2");
    }
  ),

  'Not empty file start index big buffer': create_test(function(m, callback) {
    fs.writeFileSync(m.file, fs.readFileSync(__filename).toString());
    m.monitor.start(0);
    setTimeout(callback, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      var test_file_lines = fs.readFileSync(__filename).toString().split("\n");
      var index = 0;
      test_file_lines.forEach(function(l) {
        if (l.length > 0) {
          assert.equal(l, m.lines[index]);
          index += 1;
        }
      });
      assert.equal(m.lines.length, index);
    }
  ),

  'File filled after start': create_test(function(m, callback) {
    fs.writeFileSync(m.file, "");
    m.monitor.start(0);
    setTimeout(function() {
      fs.appendFileSync(m.file, "line1\nline2\n");
      setTimeout(callback, 200);
    }, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 2);
      assert.equal(m.lines[0], "line1");
      assert.equal(m.lines[1], "line2");
    }
  ),

  'File created after start': create_test(function(m, callback) {
    m.monitor.start(0);
    setTimeout(function() {
      fs.writeFileSync(m.file, "line1\nline2\n");
      setTimeout(callback, 200);
    }, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 2);
      assert.equal(m.lines[0], "line1");
      assert.equal(m.lines[1], "line2");
    }
  ),

  'Incomplete line': create_test(function(m, callback) {
    fs.writeFileSync(m.file, "line1\nline2\nline3");
    m.monitor.start(0);
    setTimeout(function() {
      assert.equal(m.lines.length, 2);
      assert.equal(m.lines[0], "line1");
      assert.equal(m.lines[1], "line2");
      setTimeout(function() {
        fs.appendFileSync(m.file, "line3\nline4\nline5");
        setTimeout(callback, 200);
      }, 200);
    }, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 4);
      assert.equal(m.lines[0], "line1");
      assert.equal(m.lines[1], "line2");
      assert.equal(m.lines[2], "line3line3");
      assert.equal(m.lines[3], "line4");
    }
  ),


  'File filled while monitoring': create_test(function(m, callback) {
    m.fd = fs.openSync(m.file, 'a');
    var buffer = new Buffer("line1\nline2\n");
    m.monitor.start(0);
    setTimeout(function() {
      fs.writeSync(m.fd, buffer, 0, 6, null);
      fs.fsyncSync(m.fd);
        setTimeout(function() {
        assert.equal(m.lines.length, 1);
        assert.equal("line1", m.lines[0]);
        fs.writeSync(m.fd, buffer, 6, 6, null);
        fs.fsyncSync(m.fd);
        setTimeout(callback, 200);
      }, 200);
    }, 200);
    }, function check(m) {
      fs.closeSync(m.fd);
      fs.unlinkSync(m.file);
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 2);
      assert.equal(m.lines[0], "line1");
      assert.equal(m.lines[1], "line2");
    }
  ),

  'Log rotate simulation': create_test(function(m, callback) {
    m.monitor.start(0);
    setTimeout(function() {
      fs.writeFileSync(m.file, "line1\nline2\n");
      setTimeout(function() {
        assert.equal(m.lines.length, 2);
        assert.equal(m.lines[0], "line1");
        assert.equal(m.lines[1], "line2");
        fs.renameSync(m.file, m.file + ".1");
        fs.writeFileSync(m.file, "line3\nline4\n");
        setTimeout(callback, 500);
      }, 200);
    }, 200);
    }, function check(m) {
      fs.unlinkSync(m.file);
      fs.unlinkSync(m.file + ".1");
      assert.equal(m.errors.length, 0);
      assert.equal(m.lines.length, 4);
      assert.equal(m.lines[0], "line1");
      assert.equal(m.lines[1], "line2");
      assert.equal(m.lines[2], "line3");
      assert.equal(m.lines[3], "line4");
}
  ),

}).export(module);
// Do not remove empty line
