var vows = require('vows-batch-retry'),
  assert = require('assert'),
  fs = require('fs'),
  agent = require('agent'),
  spawn = require('child_process').spawn,
  dgram = require('dgram'),
  log = require('log4node'),
  whereis = require('whereis');

function createAgent(urls, callback, error_callback) {
  var a = agent.create();
  error_callback = error_callback || function(error) {
    assert.ifError(error);
  };
  a.on('error', function(module_name, error) {
    console.log('Error agent detected, ' + module_name + ' : ' + error);
    error_callback(error);
  });
  a.start(['filter://add_host://', 'filter://add_timestamp://', 'filter://add_version://'].concat(urls), function(error) {
    assert.ifError(error);
    callback(a);
  }, 200);
}

function run(command, args, pid_file, callback) {
  log.info('Starting sub process');
  var child = spawn(command, args);
  if (pid_file) {
    fs.writeFile(pid_file, child.pid, function(err) {
      if (err) {
        console.log(err);
      }
    });
  }
  child.stdout.on('data', function(data) {
    process.stdout.write('STDOUT ' + data.toString());
  });
  child.stderr.on('data', function(data) {
    process.stdout.write('STDERR ' + data.toString());
  });
  child.on('exit', function(exitCode) {
    log.info('End of sub process', exitCode);
    callback(exitCode);
  });
}

function input_file_test(args, topic_callback, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var socket = dgram.createSocket('udp4');
      socket.bind(17881);
      var datas = [];
      socket.on('message', function(data) {
        datas.push(data);
      });
      createAgent([
        'input://file://*.txt' + args,
        'output://udp://localhost:17881',
      ], function(agent) {
        run('node', ['test/500_real_life/run.js', '--file=output.txt', '--count=1500', '--period=1'], 'process.pid', function(exitCode) {
          setTimeout(function() {
            socket.close();
            agent.close(function() {
              callback(undefined, exitCode, datas);
            });
          }, 200);
        });
      });
      topic_callback();
    },

    check: function(err, exitCode, datas) {
      assert.ifError(err);
      fs.unlinkSync('output.txt');
      fs.unlinkSync('process.pid');
      check_callback();
      assert.equal(exitCode, 0);
      assert.equal(datas.length, 1500);
    }
  };
}

function output_file_test(topic_callback, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var socket = dgram.createSocket('udp4');
      run('node', ['bin/node-logstash-agent', 'input://udp://localhost:17874', 'output://file://output.txt'], 'process.pid', function(exitCode) {
        setTimeout(function() {
          socket.close();
          callback(undefined, exitCode);
        }, 100);
      });
      setTimeout(function() {
        var a = function(k) {
          if (k === 0) {
            setTimeout(function() {
              process.kill(fs.readFileSync('process.pid'));
            }, 200);
            return;
          }
          setTimeout(function() {
            var message = new Buffer('line ' + k);
            socket.send(message, 0, message.length, 17874, 'localhost', function(err) {
              if (err) {
                console.log(err);
              }
              a(k - 1);
            });
          }, 1);
        };
        a(500);
      }, 500);
      topic_callback();
    },

    check: function(err, exitCode) {
      fs.unlinkSync('process.pid');
      assert.ifError(err);
      check_callback(exitCode);
    }
  };
}

vows.describe('Real life :').addBatchRetry({
  'simple test': input_file_test('',
    function() {}, function() {}),
}, 5, 20000).addBatchRetry({
  'logrotate test, short_wait_delay_after_renaming': input_file_test('?wait_delay_after_renaming=100',
    function() {
      whereis('logrotate', function(err, logrotate) {
        if (err) {
          return console.log(err);
        }
        setTimeout(function() {
          run(logrotate, ['-f', 'test/500_real_life/std_logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        }, 500);
        setTimeout(function() {
          run(logrotate, ['-f', 'test/500_real_life/std_logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        }, 1000);
      });
    }, function() {
      fs.unlinkSync('output.txt.1');
      fs.unlinkSync('output.txt.2');
    }
  ),
}, 20, 20000).addBatchRetry({
  'logrotate test': input_file_test('',
    function() {
      whereis('logrotate', function(err, logrotate) {
        if (err) {
          return console.log(err);
        }
        setTimeout(function() {
          run(logrotate, ['-f', 'test/500_real_life/std_logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        }, 500);
        setTimeout(function() {
          run(logrotate, ['-f', 'test/500_real_life/std_logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(exitCode, 0);
          });
        }, 1000);
      });
    }, function() {
      fs.unlinkSync('output.txt.1');
      fs.unlinkSync('output.txt.2');
    }
  ),
}, 20, 20000).addBatchRetry({
  'logrotate copy_truncate test': input_file_test('?use_tail=true',
    function() {
      whereis('logrotate', function(err, logrotate) {
        if (err) {
          return console.log(err);
        }
        setTimeout(function() {
          run(logrotate, ['-f', 'test/500_real_life/copytruncate_logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(exitCode, 0);
          });
        }, 500);
        setTimeout(function() {
          run(logrotate, ['-f', 'test/500_real_life/copytruncate_logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(exitCode, 0);
          });
        }, 1000);
      });
    }, function() {
      fs.unlinkSync('output.txt.1');
      fs.unlinkSync('output.txt.2');
    }
  ),
}, 5, 20000).addBatchRetry({
  'file output test': output_file_test(
    function() {},
    function(exitCode) {
      var output = fs.readFileSync('output.txt').toString().trim().split('\n');
      fs.unlinkSync('output.txt');
      assert.equal(exitCode, 1);
      assert.equal(output.length, 500);
      var i = 500;
      output.forEach(function(k) {
        assert.equal('line ' + i, k);
        i--;
      });
    }),
}, 5, 20000).addBatchRetry({
  'file output test with logrotate': output_file_test(
    function() {
      setTimeout(function() {
        whereis('logrotate', function(err, logrotate) {
          if (err) {
            return console.log(err);
          }
          run(logrotate, ['-f', 'test/500_real_life/std_logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(exitCode, 0);
          });
        });
      }, 500);
    },
    function(exitCode) {
      var o1 = fs.readFileSync('output.txt.1').toString();
      var o2 = fs.readFileSync('output.txt').toString();
      var output = (o1 + o2).trim().split('\n');
      fs.unlinkSync('output.txt');
      fs.unlinkSync('output.txt.1');
      assert.equal(exitCode, 1);
      assert.greater(o1.length, 0);
      assert.greater(o2.length, 0);
      assert.equal(output.length, 500);
      var i = 500;
      output.forEach(function(k) {
        assert.equal(k, 'line ' + i);
        i--;
      });
    }),
}, 5, 20000).export(module);
