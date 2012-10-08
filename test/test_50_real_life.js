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
  a.loadUrls(['filter://add_source_host://', 'filter://add_timestamp://'].concat(urls), function(error) {
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

vows.describe('Real life :').addBatch({
  'simple test': {
    topic: function() {
      var callback = this.callback;
      var socket = dgram.createSocket('udp4');
      socket.bind(17881);
      var datas = [];
      socket.on('message', function(data) {
        datas.push(data);
      });
      createAgent([
        'input://file://output.txt',
        'output://udp://localhost:17881',
        ], function(agent) {
        run('node', ['50_real_life/run.js', '--file=output.txt', '--count=500', '--period=1'], undefined, function(exitCode) {
          setTimeout(function() {
            socket.close();
            agent.close(function() {
              callback(undefined, exitCode, datas);
            });
          }, 100);
        });
      });
    },

    check: function(err, exitCode, datas) {
      assert.ifError(err);
      fs.unlinkSync('output.txt');
      assert.equal(0, exitCode);
      assert.equal(500, datas.length);
    }
  },
}).addBatch({
  'logrotate test': {
    topic: function() {
      var callback = this.callback;
      var socket = dgram.createSocket('udp4');
      socket.bind(17882);
      var datas = [];
      socket.on('message', function(data) {
        datas.push(data.toString());
      });
      createAgent([
        'input://file://output.txt',
        'output://udp://localhost:17882',
        ], function(agent) {
        run('node', ['50_real_life/run.js', '--file=output.txt', '--count=500', '--period=1'], 'process.pid', function(exitCode) {
          setTimeout(function() {
            socket.close();
            agent.close(function() {
              callback(undefined, exitCode, datas);
            });
          }, 100);
        });
        whereis('logrotate', function(err, logrotate) {
          if (err) {
            return console.log(err);
          }
          setTimeout(function() {
            console.log(logrotate);
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
      });
    },

    check: function(err, exitCode, datas) {
      assert.ifError(err);
      fs.unlinkSync('output.txt');
      fs.unlinkSync('output.txt.1');
      fs.unlinkSync('output.txt.2');
      fs.unlinkSync('process.pid');
      assert.equal(0, exitCode);
      assert.equal(500, datas.length);
    }
  },
}).export(module);
