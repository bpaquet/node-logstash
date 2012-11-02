var vows = require('vows'),
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
  }
  a.on('init_error', function(module_name, error) {
    console.log("Init error agent detected, " + module_name + " : " + error);
    error_callback(error);
  });
  a.on('error', function(module_name, error) {
    console.log("Error agent detected, " + module_name + " : " + error);
    error_callback(error);
  });
  a.loadUrls(urls, function(error) {
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
        'input://file:///tmp/output.txt' + args,
        'output://udp://localhost:17881',
        ], function(agent) {
        run('node', ['50_real_life/run.js', '--file=/tmp/output.txt', '--count=1000', '--period=1'], '/tmp/process.pid', function(exitCode) {
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
      fs.unlinkSync('/tmp/output.txt');
      fs.unlinkSync('/tmp/process.pid');
      check_callback();
      assert.equal(0, exitCode);
      assert.equal(1000, datas.length);
    }
  }
}

function output_file_test(topic_callback, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var socket = dgram.createSocket('udp4');
      run('node', ['../bin/node-logstash-agent', 'input://udp://localhost:17883', 'output://file:///tmp/output.txt'], '/tmp/process.pid', function(exitCode) {
        setTimeout(function() {
          socket.close();
          callback(undefined, exitCode);
        }, 100);
      });
      setTimeout(function() {
        a = function(k) {
          if (k == 0) {
            setTimeout(function() {
              process.kill(fs.readFileSync('/tmp/process.pid'));
            }, 200);
            return;
          }
          setTimeout(function() {
            var message = new Buffer('line ' + k);
            socket.send(message, 0, message.length, 17883, 'localhost', function(err) {
              if (err) {
                console.log(err);
              }
              a(k - 1);
            });
          }, 1);
        }
        a(500);
      }, 200);
      topic_callback();
    },

    check: function(err, exitCode) {
      assert.ifError(err);
      check_callback(exitCode);
    }
  }
}

vows.describe('Real life :').addBatch({
  'simple test': input_file_test('',
    function() {
    }, function() {
    }
  ),
}).addBatch({
  'logrotate test, short wait_delay_after_renaming': input_file_test('?wait_delay_after_renaming=20',
    function() {
      whereis('logrotate', function(err, logrotate) {
        if (err) {
          return console.log(err);
        }
        setTimeout(function() {
          run(logrotate, ['-f', '50_real_life/logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        }, 500);
        setTimeout(function() {
          console.log(logrotate);
          run(logrotate, ['-f', '50_real_life/logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        }, 1000);
      });
    }, function() {
      fs.unlinkSync('/tmp/output.txt.1');
      fs.unlinkSync('/tmp/output.txt.2');
    }
  ),
}).addBatch({
  'logrotate test': input_file_test('',
    function() {
      whereis('logrotate', function(err, logrotate) {
        if (err) {
          return console.log(err);
        }
        setTimeout(function() {
          run(logrotate, ['-f', '50_real_life/logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        }, 500);
        setTimeout(function() {
          console.log(logrotate);
          run(logrotate, ['-f', '50_real_life/logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        }, 1000);
      });
    }, function() {
      fs.unlinkSync('/tmp/output.txt.1');
      fs.unlinkSync('/tmp/output.txt.2');
    }
  ),
}).addBatch({
  'file output test': output_file_test(
    function() {
    }, function(exitCode) {
      var output = fs.readFileSync('/tmp/output.txt').toString().trim().split('\n');
      fs.unlinkSync('/tmp/output.txt');
      assert.equal(1, exitCode);
      assert.equal(500, output.length);
      var i = 500;
      output.forEach(function(k) {
        assert.equal("line " + i, k);
        i --;
      }
    );
  }),
}).addBatch({
  'file output test with logrotate': output_file_test(
    function() {
      setTimeout(function() {
        whereis('logrotate', function(err, logrotate) {
          if (err) {
            return console.log(err);
          }
          run(logrotate, ['-f', '50_real_life/logrotate.conf', '-s', '/tmp/toto'], undefined, function(exitCode) {
            console.log('Logrotate exit code', exitCode);
            assert.equal(0, exitCode);
          });
        });
      }, 500);
    }, function(exitCode) {
      var o1 = fs.readFileSync('/tmp/output.txt.1').toString();
      var o2 = fs.readFileSync('/tmp/output.txt').toString();
      var output = (o1 + o2).trim().split('\n');
      fs.unlinkSync('/tmp/output.txt');
      fs.unlinkSync('/tmp/output.txt.1');
      assert.equal(1, exitCode);
      assert(o1.length > 0);
      assert(o2.length > 0);
      assert.equal(500, output.length);
      var i = 500;
      output.forEach(function(k) {
        assert.equal("line " + i, k);
        i --;
      }
    );
  }),
}).export(module);
