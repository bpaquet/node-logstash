var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    agent = require('agent'),
    net = require('net'),
    http = require('http'),
    dgram = require('dgram'),
    os = require('os');

function checkResult(line, target) {
  var parsed = JSON.parse(line);
  delete parsed['@timestamp'];
  target['@source_host'] = os.hostname();
  assert.deepEqual(parsed, target);
}

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

function file2x2x2file(config1, config2, clean_callback) {
  return {
    topic: function() {
      var callback = this.callback;

      createAgent(['input://file://main_input.txt?type=test'].concat(config1), function(a1) {
        createAgent(config2.concat(['output://file://main_output.txt']), function(a2) {
          setTimeout(function() {
            fs.appendFileSync('main_input.txt', '234 tgerhe grgh\n');
            setTimeout(function() {
              a1.close(),
              a2.close(),
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
      var a = agent.create();
      a.on('error', function(module_name, error) {
        assert.ifError(error);
      });
      a.on('init_error', function(module_name, error) {
        assert.ifError(error);
      });
      a.loadUrls(urls, function(err) {
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

function check_error_module(urls, type, expected_message_pattern, expected_module_name) {
  return {
    topic: function() {
      var callback = this.callback;
      var a = agent.create();
      a.on(type, function(module_name, error) {
        console.log("Error detected, " + module_name + " : " + error);
        callback(null, error.toString(), module_name);
      });
      a.on(type == 'error' ? 'init_error' : 'error', function(module_name, err) {
        assert.ifError(err);
      });
      a.loadUrls(urls, function(err) {
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
  'elastic_search test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      var agent = createAgent([
        'input://tcp://localhost:17874?type=nginx',
        'input://tcp://localhost:17875',
        'output://elasticsearch://localhost:17876',
        ], function(agent) {
        var es_server = http.createServer(function(req, res) {
          var body = "";
          req.on('data', function(chunk) {
            body += chunk;
          })
          req.on('end', function() {
            reqs.push({req: req, body: body});
            res.writeHead(201);
            res.end();
            if (reqs.length == 2) {
              es_server.close();
              agent.close();
              setTimeout(function() {
                  callback(null, reqs);
              }, 200);
            }
          })
        }).listen(17876);
        var c1 = net.createConnection({port: 17874}, function() {
          c1.write("toto");
          c1.end();
        });
        setTimeout(function() {
          var c2 = net.createConnection({port: 17875}, function() {
            c2.write("titi");
            c2.end();
          });
        }, 200);
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      assert.equal(reqs.length, 2);

      assert.equal(reqs[0].req.method, 'POST');
      assert(reqs[0].req.url.match('^\/logstash-' + (new Date()).getFullYear() + '\\.\\d\\d\\.\\d\\d\/data'), reqs[0].req.url + ' does not match regex');
      checkResult(reqs[0].body, {'@message': 'toto', '@source': 'tcp_port_17874', '@type': 'nginx'});

      assert.equal(reqs[1].req.method, 'POST');
      assert(reqs[1].req.url.match('^\/logstash-' + (new Date()).getFullYear() + '\\.\\d\\d\\.\\d\\d\/data'), reqs[1].req.url + ' does not match regex');
      checkResult(reqs[1].body, {'@message': 'titi', '@source': 'tcp_port_17875'});
    }
 },
}).addBatch({
  'net2file': {
    topic: function() {
      var callback = this.callback;
      createAgent([
        'input://tcp://localhost:17873?type=2',
        'output://file://output.txt',
        ], function(agent) {
        var c = net.createConnection({port: 17873}, function() {
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
      checkResult(splitted[0], {'@source': 'tcp_port_17873', '@message': 'toto', '@type': '2'});
    }
 },
}).addBatch({
  'file2statsd': {
    topic: function() {
      var callback = this.callback;
      var received = [];
      var statsd = dgram.createSocket('udp4');
      statsd.on('message', function(d) {
        received.push(d.toString());
      });
      statsd.bind(17877);
      createAgent([
        'input://file://input1.txt',
        'input://file://input2.txt?type=titi',
        'input://file://input3.txt?type=tata',
        'input://file://input4.txt?type=tete',
        'filter://regex://?regex=^45_(.*)$&fields=my_field',
        'output://statsd://127.0.0.1:17877?metric_type=increment&metric_key=toto.bouh',
        'output://statsd://127.0.0.1:17877?metric_type=decrement&metric_key=toto.#{@message}&type=titi',
        'output://statsd://127.0.0.1:17877?metric_type=counter&metric_key=toto.counter&metric_value=#{@message}&type=tata',
        'output://statsd://127.0.0.1:17877?metric_type=timer&metric_key=toto.#{my_field}.#{my_field}&metric_value=20&type=tete',
        ], function(agent) {
        setTimeout(function() {
          fs.appendFileSync('input1.txt', 'line1\n');
          setTimeout(function() {
            fs.appendFileSync('input2.txt', 'line2\n');
            setTimeout(function() {
              fs.appendFileSync('input3.txt', '10\n');
              setTimeout(function() {
                fs.appendFileSync('input4.txt', '45_123\n');
                setTimeout(function() {
                  callback(undefined, received);
                }, 200);
              }, 200);
            }, 200);
          }, 200);
        }, 200);
      });
    },

    check: function(err, data) {
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('input3.txt');
      fs.unlinkSync('input4.txt');
      assert.ifError(err);
      assert.deepEqual(data.sort(), ['toto.bouh:1|c', 'toto.line2:-1|c', 'toto.bouh:1|c', 'toto.counter:10|c', 'toto.bouh:1|c', 'toto.123.123:20|ms', 'toto.bouh:1|c'].sort());
    }
 },
 }).addBatch({
  'file2statsd_missing_field': {
    topic: function() {
      var callback = this.callback;
      var received = [];
      var errors = [];
      var statsd = dgram.createSocket('udp4');
      statsd.on('message', function(d) {
        received.push(d.toString());
      });
      statsd.bind(17878);
      createAgent([
        'input://file://input1.txt',
        'output://statsd://127.0.0.1:17878?metric_type=increment&metric_key=toto.bouh.#{unknown_field}',
        ], function(agent) {
        setTimeout(function() {
          fs.appendFileSync('input1.txt', 'line1\n');
          setTimeout(function() {
            callback(errors, received);
          }, 200);
        }, 200);
      }, function(error) {
        errors.push(error);
      });
    },

    check: function(errors, data) {
      fs.unlinkSync('input1.txt');
      assert.deepEqual(data.sort(), ['toto.bouh.:1|c'].sort());
      console.log(errors);
      assert.equal(errors.length, 1);
      assert.ok(errors[0].toString().match(/unknown_field/));
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
   ], 'init_error', 'Error: watch ENOENT', 'input_file'),
}).addBatch({
  'wrong_output_file_module': check_error_module([
    'output://file:///path_which_does_not_exist/titi.txt'
  ], 'error', 'ENOENT', 'output_file'),
}).addBatch({
  'file transport': file2x2x2file(['output://file://main_middle.txt'], ['input://file://main_middle.txt'], function() { fs.unlinkSync('main_middle.txt'); }),
}).addBatch({
  'tcp transport': file2x2x2file(['output://tcp://localhost:17879'], ['input://tcp://0.0.0.0:17879']),
}).addBatch({
  'zeromq transport': file2x2x2file(['output://zeromq://tcp://localhost:5567'], ['input://zeromq://tcp://*:5567']),
}).addBatch({
  'unix socket transport': file2x2x2file(['output://unix:///tmp/test_socket'], ['input://unix:///tmp/test_socket']),
}).export(module);
