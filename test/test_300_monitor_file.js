var vows = require('vows-batch-retry'),
  assert = require('assert'),
  os = require('os'),
  fs = require('fs'),
  path = require('path'),
  child_process = require('child_process'),
  log = require('log4node'),
  monitor_file = require('lib/monitor_file');

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
  this.monitor = monitor_file.monitor(this.file, options);
  this.monitor.on('data', function(data) {
    this.lines.push(data);
  }.bind(this));
  this.monitor.on('error', function(err) {
    log.error(err);
    this.errors.push(err);
  }.bind(this));
  this.monitor.on('renamed', function() {
    this.renamed_counter++;
  }.bind(this));
  this.monitor.on('changed', function() {
    this.changed_counter++;
  }.bind(this));
  this.monitor.on('closed', function() {
    this.closed_counter++;
  }.bind(this));
}

function run(command, args, exit_callback) {
  var child = child_process.spawn(command, args);
  child.on('error', function(err) {
    assert.ifError(err);
  });
  child.on('exit', exit_callback);
}

function create_test(start_callback, check_callback, path, options) {
  return {
    topic: function() {
      var m = new TestMonitor(randomFile(path), options);
      var callback = this.callback;
      start_callback(m, function(err) {
        setTimeout(function() {
          m.monitor.close(function() {
            callback(err, m);
          });
        }, 20);
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
  'Not existent file': create_test(
    function(m, callback) {
      m.monitor.start(callback);
    }, function(m) {
      no_error(m);
      assert.equal(m.lines.length, 0);
    }
  ),
}).addBatch({
  'Empty file': create_test(
    function(m, callback) {
      fs.writeFile(m.file, '', function(err) {
        assert.ifError(err);
        m.monitor.start(callback);
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.equal(m.lines.length, 0);
    }
  ),
}).addBatch({
  'Not empty file start index undefined': create_test(
    function(m, callback) {
      fs.writeFile(m.file, 'line1\nline2\n', function(err) {
        assert.ifError(err);
        m.monitor.start(callback);
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.equal(m.lines.length, 0);
    }
  ),
}).addBatch({
  'Not empty file start index 0': create_test(
    function(m, callback) {
      fs.writeFile(m.file, 'line1\nline2\n', function(err) {
        assert.ifError(err);
        m.monitor.start(callback, 0);
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.deepEqual(m.lines, ['line1', 'line2']);
    }
  ),
}).addBatch({
  'Not empty file start index 3': create_test(
    function(m, callback) {
      fs.writeFile(m.file, 'line1\nline2\n', function(err) {
        assert.ifError(err);
        m.monitor.start(callback, 3);
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.deepEqual(m.lines, ['e1', 'line2']);
    }
  ),
}).addBatch({
  'Not empty file start index 0, big buffer, and empty line removal': create_test(
    function(m, callback) {
      fs.writeFile(m.file, fs.readFileSync(__filename).toString(), function(err) {
        assert.ifError(err);
        m.monitor.start(callback, 0);
      });
    }, function(m) {
      setTimeout(function() {
        fs.unlinkSync(m.file);
        no_error(m);
        var test_file_lines = fs.readFileSync(__filename).toString().split('\n');
        var index = 0;
        test_file_lines.forEach(function(l) {
          if (l.length > 0) {
            assert.equal(l, m.lines[index]);
            index += 1;
          }
        });
        assert.equal(m.lines.length, index);
      }, 500);
    }
  ),
}).addBatch({
  'File filled after start': create_test(
    function(m, callback) {
      fs.writeFile(m.file, '', function(err) {
        assert.ifError(err);
        m.monitor.start(function(err) {
          assert.ifError(err);
          fs.appendFile(m.file, 'line1\nline2\n', function(err) {
            assert.ifError(err);
            setTimeout(callback, 200);
          });
        });
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.deepEqual(m.lines, ['line1', 'line2']);
    }
  ),
}).addBatch({
  'File created after start': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.writeFile(m.file, 'line1\nline2\n', function(err) {
        assert.ifError(err);
        setTimeout(callback, 200);
      });
    }, 0);
  }, function check(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File created after start, filled with append': create_test(
    function(m, callback) {
      m.monitor.start(function(err) {
        assert.ifError(err);
        fs.appendFile(m.file, 'line1\n', function(err) {
          assert.ifError(err);
          setTimeout(function() {
            fs.appendFile(m.file, 'line2\n', function(err) {
              assert.ifError(err);
              setTimeout(callback, 200);
            });
          }, 200);
        });
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.deepEqual(m.lines, ['line1', 'line2']);
    }
  ),
}).addBatch({
  'File rewritten from start': create_test(
    function(m, callback) {
      m.monitor.start(function(err) {
        assert.ifError(err);
        fs.appendFile(m.file, 'line1\n', function(err) {
          assert.ifError(err);
          setTimeout(function() {
            fs.writeFile(m.file, 'line2\n', function(err) {
              assert.ifError(err);
              setTimeout(callback, 200);
            });
          }, 200);
        });
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.deepEqual(m.lines, ['line1', 'line2']);
    }
  ),
}).addBatch({
  'File removed': create_test(function(m, callback) {
    fs.writeFileSync(m.file, 'line1\nline2\n');
    m.monitor.start(function(err) {
      assert.ifError(err);
      setTimeout(function() {
        fs.unlinkSync(m.file);
        setTimeout(callback, 200);
      }, 200);
    }, 0);
  }, function check(m) {
    assert.equal(m.monitor.fdTailer, undefined);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'File removed and recreated': create_test(function(m, callback) {
    fs.writeFileSync(m.file, 'line1\nline2\n');
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.unlink(m.file, function(err) {
        assert.ifError(err);
        setTimeout(function() {
          assert.equal(m.monitor.fdTailer, undefined);
          assert.equal(1, m.monitor.oldFdTailers.length);
          setTimeout(function() {
            assert.equal(0, m.monitor.oldFdTailers.length);
            fs.writeFile(m.file, 'line3\n', function(err) {
              assert.ifError(err);
              setTimeout(callback, 200);
            });
          }, 200);
        }, 10);
      });
    }, 0);
  }, function check(m) {
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2', 'line3']);
  }, undefined, {
    wait_delay_after_renaming: 100
  }),
}).addBatch({
  'File renamed, same name': create_test(function(m, callback) {
    fs.writeFileSync(m.file, 'line1\nline2\n');
    m.monitor.start(function(err) {
      assert.ifError(err);
      m.monitor.emit('renamed', m.file);
      setTimeout(function() {
        assert.equal(0, m.monitor.oldFdTailers.length);
        fs.appendFile(m.file, 'line3\n', function(err) {
          assert.ifError(err);
          setTimeout(callback, 200);
        });
      }, 200);
    }, 0);
  }, function check(m) {
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2', 'line1', 'line2', 'line3']);
  }),
}).addBatch({
  'Incomplete line': create_test(function(m, callback) {
    fs.writeFileSync(m.file, 'line1\nline2\nline3');
    m.monitor.start(function(err) {
      assert.ifError(err);
      setTimeout(function() {
        assert.deepEqual(m.lines, ['line1', 'line2']);
        setTimeout(function() {
          fs.appendFile(m.file, 'line3\nline4\nline5', function(err) {
            assert.ifError(err);
            setTimeout(callback, 200);
          });
        }, 200);
      }, 200);
    }, 0);
  }, function check(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2', 'line3line3', 'line4']);
  }),
}).addBatch({
  'Fd filled while monitoring': create_test(function(m, callback) {
    m.test_fd = fs.openSync(m.file, 'a');
    var buffer = new Buffer('line1\nline2\n');
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.write(m.test_fd, buffer, 0, 6, null, function(err) {
        assert.ifError(err);
        fs.fsync(m.test_fd, function(err) {
          assert.ifError(err);
          setTimeout(function() {
            assert.deepEqual(m.lines, ['line1']);
            fs.write(m.test_fd, buffer, 6, 6, null, function(err) {
              assert.ifError(err);
              fs.fsync(m.test_fd, function(err) {
                assert.ifError(err);
                setTimeout(callback, 200);
              });
            });
          }, 200);
        });
      });
    }, 0);
  }, function check(m) {
    fs.closeSync(m.test_fd);
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2']);
  }),
}).addBatch({
  'utf8 encoding': create_test(
    function(m, callback) {
      fs.writeFile(m.file, 'é\nline2\n', function(err) {
        assert.ifError(err);
        m.monitor.start(function(err) {
          assert.ifError(err);
          setTimeout(callback, 200);
        }, 0);
      });
    }, function(m) {
      fs.unlinkSync(m.file);
      no_error(m);
      assert.deepEqual(m.lines, ['é', 'line2']);
    }
  ),
}).addBatch({
  'ascii encoding': create_test(function(m, callback) {
    fs.writeFile(m.file, 'é\nline2\n', function(err) {
      assert.ifError(err);
      m.monitor.start(function(err) {
        assert.ifError(err);
        setTimeout(callback, 200);
      }, 0);
    });
  }, function(m) {
    fs.unlinkSync(m.file);
    no_error(m);
    assert.deepEqual(m.lines, ['C)', 'line2']);
  }, undefined, {
    buffer_encoding: 'ascii'
  }),
}).addBatchRetry({
  'Double monitoring same directory': {
    topic: function() {
      var callback = this.callback;
      var m1 = new TestMonitor(randomFile());
      var m2 = new TestMonitor(randomFile());
      m1.monitor.start();
      m2.monitor.start();
      fs.appendFile(m1.file, 'line1\n', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          fs.appendFile(m2.file, 'line10\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile(m1.file, 'line2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  m1.monitor.close(function() {
                    m2.monitor.close(function() {
                      callback(undefined, m1, m2);
                    });
                  });
                }, 200);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err, m1, m2) {
      assert.ifError(err);
      fs.unlinkSync(m1.file);
      fs.unlinkSync(m2.file);
      no_error(m1);
      no_error(m2);
      assert.deepEqual(m1.lines, ['line1', 'line2']);
      assert.equal(m1.changed_counter, 2);
      assert.deepEqual(m2.lines, ['line10']);
      assert.equal(m2.changed_counter, 1);
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
}).addBatchRetry({
  'Simple logrotate simulation': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.writeFile(m.file, 'line1\nline2\n', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          assert.deepEqual(m.lines, ['line1', 'line2']);
          fs.rename(m.file, m.file + '.1', function(err) {
            assert.ifError(err);
            fs.writeFile(m.file, 'line3\nline4\n', function(err) {
              assert.ifError(err);
              setTimeout(callback, 200);
            });
          });
        }, 200);
      });
    }, 0);
  }, function check(m) {
    fs.unlinkSync(m.file);
    fs.unlinkSync(m.file + '.1');
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2', 'line3', 'line4']);
    assert.equal(m.closed_counter, 2);
  }, undefined, {
    wait_delay_after_renaming: 1
  }),
}, 5, 10000).addBatchRetry({
  'Complex logrotate simulation': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.writeFile(m.file, 'line1\nline2\n', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          assert.deepEqual(m.lines, ['line1', 'line2']);
          fs.rename(m.file, m.file + '.1', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile(m.file + '.1', 'line3\nline4\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  fs.writeFile(m.file, 'line5\nline6\n', function(err) {
                    assert.ifError(err);
                    setTimeout(callback, 500);
                  });
                }, 100);
              });
            }, 100);
          });
        }, 200);
      });
    }, 0);
  }, function check(m) {
    fs.unlinkSync(m.file);
    fs.unlinkSync(m.file + '.1');
    no_error(m);
    assert.deepEqual(m.lines, ['line1', 'line2', 'line3', 'line4', 'line5', 'line6']);
    assert.equal(m.closed_counter, 2);
  }, undefined, {
    wait_delay_after_renaming: 500
  }),
}, 5, 10000).addBatchRetry({
  'Complex logrotate simulation with permission pb': create_test(function(m, callback) {
    m.monitor.start(function(err) {
      assert.ifError(err);
      fs.writeFile(m.file, 'line1\nline2\n', function(err) {
        assert.ifError(err);
        setTimeout(function() {
          assert.deepEqual(m.lines, ['line1', 'line2']);
          fs.rename(m.file, m.file + '.1', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              run('/bin/sh', ['-c', 'umask 777 && touch ' + m.file], function(exit_code) {
                assert.equal(exit_code, 0);
                setTimeout(function() {
                  run('/bin/sh', ['-c', 'chmod 644 ' + m.file], function(exit_code) {
                    assert.equal(exit_code, 0);
                    setTimeout(function() {
                      fs.writeFile(m.file, 'line3\nline4\n', function(err) {
                        assert.ifError(err);
                        setTimeout(callback, 200);
                      });
                    }, 100);
                  });
                }, 100);
              });
            }, 100);
          });
        }, 200);
      });
    }, 0);
  }, function check(m) {
    fs.unlinkSync(m.file);
    fs.unlinkSync(m.file + '.1');
    assert.greater(m.errors.length, 0);
    assert.match(m.errors[0].toString(), /EACCES/);
    assert.deepEqual(m.lines, ['line1', 'line2', 'line3', 'line4']);
    assert.equal(m.closed_counter, 2);
  }, undefined, {
    wait_delay_after_renaming: 500
  }),
}, 5, 10000).addBatchRetry({
  'Monitor restart': {
    topic: function() {
      var callback = this.callback;
      var m1 = new TestMonitor(randomFile());
      m1.monitor.start(function(err) {
        assert.ifError(err);
        fs.appendFile(m1.file, 'line1\nline2\n', function(err) {
          assert.ifError(err);
          setTimeout(function() {
            m1.monitor.close(function() {
              var m2 = new TestMonitor(m1.file);
              m2.monitor.start(function(err) {
                assert.ifError(err);
                fs.appendFile(m1.file, 'line3\nline4\n', function(err) {
                  assert.ifError(err);
                  setTimeout(function() {
                    m2.monitor.close(function() {
                      callback(undefined, m1, m2);
                    });
                  });
                });
              });
            });
          }, 200);
        });
      });
    },

    check: function(err, m1, m2) {
      assert.ifError(err);
      fs.unlinkSync(m1.file);
      no_error(m1);
      no_error(m2);
      assert.deepEqual(m1.lines, ['line1', 'line2']);
      assert.equal(m1.changed_counter, 1);
      assert.deepEqual(m2.lines, ['line3', 'line4']);
      assert.equal(m2.changed_counter, 1);
    }
  }
}, 5, 10000).addBatchRetry({
  'Monitor restart with write while restart': {
    topic: function() {
      var callback = this.callback;
      var m1 = new TestMonitor(randomFile());
      m1.monitor.start(function(err) {
        assert.ifError(err);
        fs.appendFile(m1.file, 'line1\nline2\n', function(err) {
          assert.ifError(err);
          setTimeout(function() {
            m1.monitor.close(function() {
              setTimeout(function() {
                fs.appendFile(m1.file, 'line3\nline4\n', function(err) {
                  assert.ifError(err);
                  var m2 = new TestMonitor(m1.file);
                  m2.monitor.start(function(err) {
                    assert.ifError(err);
                    fs.appendFile(m1.file, 'line5\nline6\n', function(err) {
                      assert.ifError(err);
                      setTimeout(function() {
                        m2.monitor.close(function() {
                          callback(undefined, m1, m2);
                        });
                      }, 200);
                    });
                  });
                });
              }, 500);
            });
          }, 200);
        });
      });
    },

    check: function(err, m1, m2) {
      assert.ifError(err);
      fs.unlinkSync(m1.file);
      no_error(m1);
      no_error(m2);
      assert.deepEqual(m1.lines, ['line1', 'line2']);
      assert.equal(m1.changed_counter, 1);
      assert.deepEqual(m2.lines, ['line3', 'line4', 'line5', 'line6']);
      assert.equal(m2.changed_counter, 1);
    }
  }
}, 5, 10000).addBatchRetry({
  'Monitor restart with write while restart, in a new file, too short': {
    topic: function() {
      var callback = this.callback;
      var m1 = new TestMonitor(randomFile());
      m1.monitor.start(function(err) {
        assert.ifError(err);
        fs.appendFile(m1.file, 'line1\nline2\n', function(err) {
          assert.ifError(err);
          setTimeout(function() {
            m1.monitor.close(function() {
              setTimeout(function() {
                fs.unlink(m1.file, function(err) {
                  assert.ifError(err);
                  fs.appendFile(m1.file, 'line3\n', function(err) {
                    assert.ifError(err);
                    var m2 = new TestMonitor(m1.file);
                    m2.monitor.start(function(err) {
                      assert.ifError(err);
                      fs.appendFile(m1.file, 'line4\nline5\n', function(err) {
                        assert.ifError(err);
                        setTimeout(function() {
                          m2.monitor.close(function() {
                            callback(undefined, m1, m2);
                          });
                        }, 200);
                      });
                    });
                  });
                });
              }, 500);
            });
          }, 200);
        });
      });
    },

    check: function(err, m1, m2) {
      assert.ifError(err);
      fs.unlinkSync(m1.file);
      no_error(m1);
      no_error(m2);
      assert.deepEqual(m1.lines, ['line1', 'line2']);
      assert.equal(m1.changed_counter, 1);
      assert.deepEqual(m2.lines, ['line4', 'line5']);
      assert.equal(m2.changed_counter, 1);
    }
  }
}, 5, 10000).addBatchRetry({
  'Monitor restart with write while restart, in a new file, content not correct': {
    topic: function() {
      var callback = this.callback;
      var m1 = new TestMonitor(randomFile());
      m1.monitor.start(function(err) {
        assert.ifError(err);
        fs.appendFile(m1.file, 'line1\nline2\n', function(err) {
          assert.ifError(err);
          setTimeout(function() {
            m1.monitor.close(function() {
              setTimeout(function() {
                fs.unlink(m1.file, function(err) {
                  assert.ifError(err);
                  fs.appendFile(m1.file, 'line3\nline4\nline5\n', function(err) {
                    assert.ifError(err);
                    var m2 = new TestMonitor(m1.file);
                    m2.monitor.start(function(err) {
                      assert.ifError(err);
                      fs.appendFile(m1.file, 'line6\nline7\n', function(err) {
                        assert.ifError(err);
                        setTimeout(function() {
                          m2.monitor.close(function() {
                            callback(undefined, m1, m2);
                          });
                        }, 200);
                      });
                    });
                  });
                });
              }, 500);
            });
          }, 200);
        });
      });
    },

    check: function(err, m1, m2) {
      assert.ifError(err);
      fs.unlinkSync(m1.file);
      no_error(m1);
      no_error(m2);
      assert.deepEqual(m1.lines, ['line1', 'line2']);
      assert.equal(m1.changed_counter, 1);
      assert.deepEqual(m2.lines, ['line6', 'line7']);
      assert.equal(m2.changed_counter, 1);
    }
  }
}, 5, 10000).addBatchRetry({
  'Monitor fifo': {
    topic: function() {
      var callback = this.callback;
      run('mkfifo', ['toto_fifo'], function(exitCode) {
        assert.equal(0, exitCode);
        var m = new TestMonitor('toto_fifo', {});
        m.monitor.start(function(err) {
          assert.ifError(err);
          run('sh', ['-c', 'echo x1 > toto_fifo'], function(exitCode) {
            assert.equal(0, exitCode);
            run('sh', ['-c', 'echo x2 > toto_fifo'], function(exitCode) {
              assert.equal(0, exitCode);
              setTimeout(function() {
                m.monitor.close(function() {
                  callback(undefined, m);
                });
              }, 200);
            });
          });
        });
      });
    },

    check: function(err, m) {
      assert.ifError(err);
      fs.unlinkSync('toto_fifo');
      no_error(m);
      assert.deepEqual(m.lines, ['x1', 'x2']);
    }
  }
}, 5, 10000).export(module);
// Do not remove empty line, this file is used during test
