var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    agent = require('agent'),
    net = require('net'),
    os = require('os'),
    Log4Node = require('log4node');

function checkResult(line, target) {
  var parsed = JSON.parse(line);
  delete parsed['@timestamp'];
  target['@source_host'] = os.hostname();
  assert.deepEqual(parsed, target);
}

function createAgent(callback) {
  var logstashAgent = agent.create();
  logstashAgent.on('error', function(module_name, index, error) {
    console.log("Error agent 1 detected, " + module_name + ", " + index + " : " + error);
    assert.ifError(error);
  });
  logstashAgent.set_logger(new Log4Node('info'));
  logstashAgent.on('config_loaded', function() {
    setTimeout(function() {
      callback();
    }, 100);
  });
  return logstashAgent;
}

function file2file(init_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var logstashAgent = createAgent(function() {
        fs.appendFileSync('input1.txt', 'line1\n');
        setTimeout(function() {
          fs.appendFileSync('input2.txt', 'line2\n');
          setTimeout(function() {
            fs.appendFileSync('input1.txt', 'line3\n');
            setTimeout(function() {
              logstashAgent.close();
              setTimeout(function() {
                callback(null);
              }, 100);
            }, 100);
          }, 30);
        }, 30);
      });
      init_callback(logstashAgent);
    },

    check: function() {
      var c1 = fs.readFileSync('output1.txt').toString();
      var c2 = fs.readFileSync('output2.txt').toString();
      assert.equal(c1, c2);
      var splitted = c1.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'@source': 'input1.txt', '@message': 'line1'});
      checkResult(splitted[1], {'@source': 'input2.txt', '@message': 'line2', '@type': 'input2'});
      checkResult(splitted[2], {'@source': 'input1.txt', '@message': 'line3'});
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('output1.txt');
      fs.unlinkSync('output2.txt');
    }
  }
}

function file2x2x2file(transport_name, clean_callback) {
  return {
    topic: function() {
      var callback = this.callback;

      var logstashAgent1 = createAgent(function() {
        var logstashAgent2 = createAgent(function() {
          fs.appendFileSync('main_input.txt', '234 tgerhe grgh\n');
          setTimeout(function() {
            callback(null);
          }, 200);
        });
        logstashAgent2.load_config_from_file("configs/transports/" + transport_name + "_2.json");
      });
      logstashAgent1.load_config_from_file("configs/transports/" + transport_name + "_1.json");
    },

    check: function() {
      var c = fs.readFileSync('main_output.txt').toString();
      var splitted = c.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'@source': 'main_input.txt', '@message': '234 tgerhe grgh', '@type': 'test'});
      fs.unlinkSync('main_input.txt');
      fs.unlinkSync('main_output.txt');
      if (clean_callback) {
        clean_callback();
      }
    }
  }
}

function check_error(init_callback, expected_error_module, expected_error_index) {
  return {
    topic: function() {
      var callback = this.callback;
      var logstashAgent = agent.create();
      logstashAgent.on('error', function(module_name, index, error) {
        console.log("Error detected, " + module_name + ", " + index + " : " + error);
        callback(module_name, index, error);
      });
      logstashAgent.set_logger(new Log4Node('info'));
      init_callback(logstashAgent);
    },

    check: function(module_name, index, error) {
      assert.equal(module_name, expected_error_module);
      assert.equal(index, expected_error_index);
    }
  }
}

vows.describe('Integration :').addBatch({
  'file2file': file2file(function(logstashAgent) {
    logstashAgent.load_config_from_directory('configs/file2file');
  })
}).addBatch({
  'file2file with single file': file2file(function(logstashAgent) {
    logstashAgent.load_config_from_file('configs/file2file/1.json');
  })
}).addBatch({
  'net2file': {
    topic: function() {
      var callback = this.callback;
      var logstashAgent = createAgent(function() {
        var c = net.createConnection({port: 17874}, function() {
          c.write("toto");
          c.end();
        });
        c.on('end', function() {
          setTimeout(function() {
            logstashAgent.close();
            setTimeout(function() {
              callback(null);
            }, 100);
          }, 100);
        });
      });
      logstashAgent.load_config_from_file("configs/misc/net2file.json");
    },

    check: function() {
      var c1 = fs.readFileSync('output.txt').toString();
      var splitted = c1.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'@source': 'tcp_port_17874', '@message': 'toto'});
      fs.unlinkSync('output.txt');
    }
  },
}).addBatch({
  'input_file_error': check_error(function(logstashAgent) {
    logstashAgent.load_config_from_file("configs/errors/wrong_input_file.json");
  }, "input_file", 0),
}).addBatch({
  'config_file_not_existent': check_error(function(logstashAgent) {
    logstashAgent.load_config_from_file("configs/errors/wrong_input_file_toto_42.json");
  }, "config_loader", 0),
}).addBatch({
  'not_existent_module': check_error(function(logstashAgent) {
    logstashAgent.load_config_from_file("configs/errors/not_existent_module.json");
  }, "loading_modules", 0),
}).addBatch({
  'wrong_output_file_module': check_error(function(logstashAgent) {
    logstashAgent.load_config_from_file("configs/errors/wrong_output_file.json");
  }, "output_file", 0),
}).addBatch({
  'file transport': file2x2x2file('file', function() { fs.unlinkSync('main_middle.txt'); }),
}).addBatch({
  'tcp transport': file2x2x2file('tcp'),
}).export(module);
