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

function createAgent(urls, callback) {
  var logstashAgent = agent.create();
  logstashAgent.on('error', function(module_name, index, error) {
    console.log("Error agent 1 detected, " + module_name + ", " + index + " : " + error);
    assert.ifError(error);
  });
  logstashAgent.set_logger(new Log4Node('info'));
  logstashAgent.load_urls(['filter://add_source_host://', 'filter://add_timestamp://'].concat(urls), function(err) {
    assert.ifError(err);
    callback(logstashAgent);
  }, 200);
}

function file2x2x2file(config1, config2, clean_callback) {
  return {
    topic: function() {
      var callback = this.callback;

      createAgent(['input://file://main_input.txt?type=test'].concat(config1), function(logstashAgent1) {
        createAgent(config2.concat(['output://file://main_output.txt']), function(logstashAgent2) {
          setTimeout(function() {
            fs.appendFileSync('main_input.txt', '234 tgerhe grgh\n');
            setTimeout(function() {
              logstashAgent1.close(),
              logstashAgent2.close(),
              setTimeout(function() {
                callback(null);
              }, 200);
            }, 200);
          }, 200);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);

      var c = fs.readFileSync('main_output.txt').toString();
      fs.unlinkSync('main_input.txt');
      fs.unlinkSync('main_output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'@source': 'main_input.txt', '@message': '234 tgerhe grgh', '@type': 'test'});
      if (clean_callback) {
        clean_callback();
      }
    }
  }
}

function check_error_init(urls, expected_message_pattern) {
  return {
    topic: function() {
      var callback = this.callback;
      var logstashAgent = agent.create();
      console.log(urls);
      logstashAgent.on('error', function(module_name, error) {
        assert.ifError(error);
      });
      logstashAgent.set_logger(new Log4Node('info'));
      logstashAgent.load_urls(urls, function(err) {
        if (err) {
          return callback(null, err.toString());
        }
        asser.fail("Init success, should not");
      }, 200);
    },

    check: function(error, message) {
      assert.ifError(error);
      assert.ok(message.match(expected_message_pattern), 'Message does not match pattern : ' + expected_message_pattern + ' : ' + message);
    }
  }
}

function check_error_module(urls, expected_message_pattern, expected_module_name) {
  return {
    topic: function() {
      var callback = this.callback;
      var logstashAgent = agent.create();
      console.log(urls);
      logstashAgent.on('error', function(module_name, error) {
        console.log("Error detected, " + module_name + " : " + error);
        callback(null, error.toString(), module_name);
      });
      logstashAgent.set_logger(new Log4Node('info'));
      logstashAgent.load_urls(urls, function(err) {
        assert.ifError(err);
      }, 200);
    },

    check: function(err, message, module_name) {
      assert.ifError(err);
      assert.ok(message.match(expected_message_pattern), 'Message does not match pattern : ' + expected_message_pattern + ' : ' + message);
      assert.equal(module_name, expected_module_name);
    }
  }
}

vows.describe('Integration :').addBatch({
  'file2file': {
    topic: function() {
      var callback = this.callback;
      createAgent([
        'input://file://input1.txt',
        'input://file://input2.txt?type=input2',
        'output://file://output1.txt',
        'output://file://output2.txt',
        ], function(agent) {
        fs.appendFileSync('input1.txt', 'line1\n');
        setTimeout(function() {
          fs.appendFileSync('input2.txt', 'line2\n');
          setTimeout(function() {
            fs.appendFileSync('input1.txt', 'line3\n');
            setTimeout(function() {
              agent.close();
              setTimeout(function() {
                callback(null);
              }, 200);
            }, 200);
          }, 200);
        }, 200);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output1.txt').toString();
      var c2 = fs.readFileSync('output2.txt').toString();
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('output1.txt');
      fs.unlinkSync('output2.txt');

      assert.equal(c1, c2);
      var splitted = c1.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'@source': 'input1.txt', '@message': 'line1'});
      checkResult(splitted[1], {'@source': 'input2.txt', '@message': 'line2', '@type': 'input2'});
      checkResult(splitted[2], {'@source': 'input1.txt', '@message': 'line3'});
    }
  },
}).addBatch({
  'net2file': {
    topic: function() {
      var callback = this.callback;
      createAgent([
        'input://tcp://localhost:17874?type=2',
        'output://file://output.txt',
        ], function(agent) {
        var c = net.createConnection({port: 17874}, function() {
          c.write("toto");
          c.end();
        });
        c.on('end', function() {
          setTimeout(function() {
            agent.close();
            setTimeout(function() {
              callback(null);
            }, 100);
          }, 100);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');

      var splitted = c1.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'@source': 'tcp_port_17874', '@message': 'toto', '@type': '2'});
    }
 },
}).addBatch({
  'non_existent_module': check_error_init([
    'input://non_existent_module://'
    ], 'Cannot find module'),
  'wrong url': check_error_init([
    'input://non_existent_module'
    ], 'Unable to extract plugin name'),
  'wrong url init': check_error_init([
    'toto://non_existent_module://'
    ], 'Unknown protocol'),
  'wrong port in tcp module': check_error_init([
    'input://tcp://localhost:abcd'
    ], 'Unable to parse host'),
}).addBatch({
  'input_file_error': check_error_module([
    'input://file:///path_which_does_not_exist/input1.txt',
    'output://stdout://'
    ], 'Directory not found', 'input_file'),
}).addBatch({
  'wrong_output_file_module': check_error_module([
    'output://file:///path_which_does_not_exist/titi.txt'
  ], 'ENOENT', 'output_file'),
}).addBatch({
  'file transport': file2x2x2file(['output://file://main_middle.txt'], ['input://file://main_middle.txt'], function() { fs.unlinkSync('main_middle.txt'); }),
}).addBatch({
  'tcp transport': file2x2x2file(['output://tcp://localhost:17875'], ['input://tcp://0.0.0.0:17875']),
}).addBatch({
  'zeromq transport': file2x2x2file(['output://zeromq://tcp://localhost:5567'], ['input://zeromq://tcp://*:5567']),
}).export(module);
