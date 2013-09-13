var vows = require('vows-batch-retry'),
    assert = require('assert'),
    fs = require('fs'),
    agent = require('agent'),
    net = require('net'),
    http = require('http'),
    dgram = require('dgram'),
    os = require('os'),
    zlib = require('zlib'),
    monitor_file = require('../lib/lib/monitor_file');

function checkResult(line, target, not_override_source_host) {
  var parsed = JSON.parse(line);
  delete parsed['@fields'];
  delete parsed['@timestamp'];
  if (! not_override_source_host) {
    target['source_host'] = os.hostname();
  }
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
  });
}

function file2x2x2file(config1, config2, clean_callback) {
  return {
    topic: function() {
      if (clean_callback) {
        clean_callback();
      }
      monitor_file.setFileStatus({});
      var callback = this.callback;
      createAgent(['input://file://main_input.txt?type=test'].concat(config1), function(a1) {
        createAgent(config2.concat(['output://file://main_output.txt?serializer=json_logstash']), function(a2) {
          setTimeout(function() {
            fs.appendFile('main_input.txt', '234 tgerhe grgh\n', function(err) {
              assert.ifError(err);
              setTimeout(function() {
                a1.close(function() {
                  a2.close(function() {
                    callback(null);
                  });
                });
              }, 200);
            });
          }, 200);
        }, 200);
      });
    },

    check: function(err) {
      assert.ifError(err);

      if (clean_callback) {
        clean_callback();
      }

      var c = fs.readFileSync('main_output.txt').toString();
      fs.unlinkSync('main_input.txt');
      fs.unlinkSync('main_output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'source': 'main_input.txt', 'message': '234 tgerhe grgh', 'type': 'test'});
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

vows.describe('Integration :').addBatchRetry({
  'file2file': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      createAgent([
        'input://file://input1.txt',
        'input://file://input2.txt?type=input2',
        'output://file://output1.txt?serializer=json_logstash',
        'output://file://output2.txt?serializer=json_logstash',
        'output://file://output3.txt?serializer=raw&format=_#{message}_',
        ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', 'line1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile('input2.txt', 'line2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  fs.appendFile('input1.txt', 'line3\n', function(err) {
                    assert.ifError(err);
                    setTimeout(function() {
                      agent.close(function() {
                        callback(null);
                      });
                    }, 200);
                  });
                }, 200);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output1.txt').toString();
      var c2 = fs.readFileSync('output2.txt').toString();
      var c3 = fs.readFileSync('output3.txt').toString();
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('output1.txt');
      fs.unlinkSync('output2.txt');
      fs.unlinkSync('output3.txt');

      assert.equal(c1, c2);
      var splitted = c1.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'source': 'input1.txt', 'message': 'line1'});
      checkResult(splitted[1], {'source': 'input2.txt', 'message': 'line2', 'type': 'input2'});
      checkResult(splitted[2], {'source': 'input1.txt', 'message': 'line3'});

      assert.equal("_line1_\n_line2_\n_line3_\n", c3);
    }
  },
}, 5, 20000).addBatchRetry({
  'file2file not exising dir': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      createAgent([
        'input://file://toto/56/87/input.txt',
        'output://file://output.txt?serializer=json_logstash',
        ], function(agent) {
        setTimeout(function() {
          fs.mkdir('toto', function(err) {
            assert.ifError(err);
            fs.mkdir('toto/56', function(err) {
              assert.ifError(err);
              fs.mkdir('toto/56/87', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  fs.appendFile('toto/56/87/input.txt', 'line1\n', function(err) {
                    assert.ifError(err);
                    fs.appendFile('toto/56/87/input.txt', 'line2\n', function(err) {
                      assert.ifError(err);
                      setTimeout(function() {
                        agent.close(function() {
                          callback(null);
                        });
                      }, 200);
                    });
                  });
                });
              });
            });
          });
        }, 500);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('toto/56/87/input.txt');
      fs.rmdirSync('toto/56/87');
      fs.rmdirSync('toto/56');
      fs.rmdirSync('toto');
      fs.unlinkSync('output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 3);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'source': 'toto/56/87/input.txt', 'message': 'line1'});
      checkResult(splitted[1], {'source': 'toto/56/87/input.txt', 'message': 'line2'});
    }
  },
}, 5, 20000).addBatchRetry({
  'json_logstash_event': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      createAgent([
        'input://udp://0.0.0.0:67854',
        'output://file://output.txt?serializer=json_logstash',
        ], function(agent) {
        var socket = dgram.createSocket('udp4');
        var udp_send = function(s) {
          var buffer = new Buffer(s);
          socket.send(buffer, 0, buffer.length, 67854, 'localhost', function(err, bytes) {
            if (err || bytes != buffer.length) {
            }
          })
        };
        setTimeout(function() {
          udp_send('toto');
          setTimeout(function() {
            udp_send('{"tata":"toto","type":"titi"}');
            setTimeout(function() {
              udp_send('{"tata":"toto","message":"titi", "source": "test42", "type": "pouet"}');
              setTimeout(function() {
                socket.close();
                callback(null)
              }, 200);
            }, 50);
          }, 50);
        }, 50);
      }.bind(this));
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');
      var splitted = c.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal("", splitted[splitted.length - 1]);
      checkResult(splitted[0], {'source': 'udp_0.0.0.0_67854', 'source_host': '127.0.0.1', 'message': 'toto'}, true);
      checkResult(splitted[1], {'source': 'udp_0.0.0.0_67854', 'source_host': '127.0.0.1', 'message': '{"tata":"toto","type":"titi"}'}, true);
      checkResult(splitted[2], {'source': 'test42', 'source_host': '127.0.0.1', 'type': 'pouet', 'tata': 'toto', 'message': 'titi'});
    }
  },
}, 5, 20000).addBatchRetry({
  'elastic_search test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      var agent = createAgent([
        'input://tcp://0.0.0.0:17874?type=nginx',
        'input://tcp://0.0.0.0:17875',
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
              agent.close(function() {
                es_server.close(function() {
                  callback(null, reqs);
                });
              });
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
      checkResult(reqs[0].body, {'message': 'toto', 'source': 'tcp_0.0.0.0_17874', 'type': 'nginx'});

      assert.equal(reqs[1].req.method, 'POST');
      assert(reqs[1].req.url.match('^\/logstash-' + (new Date()).getFullYear() + '\\.\\d\\d\\.\\d\\d\/data'), reqs[1].req.url + ' does not match regex');
      checkResult(reqs[1].body, {'message': 'titi', 'source': 'tcp_0.0.0.0_17875'});
    }
 },
}, 5, 20000).addBatchRetry({
  'http_post test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      var agent = createAgent([
        'input://tcp://0.0.0.0:17874?type=pouet',
        'output://http_post://localhost:17875?path=/#{type}',
        ], function(agent) {
        var http_server = http.createServer(function(req, res) {
          var body = "";
          req.on('data', function(chunk) {
            body += chunk;
          })
          req.on('end', function() {
            reqs.push({req: req, body: body});
            res.writeHead(204);
            res.end();
            if (reqs.length == 1) {
              agent.close(function() {
                http_server.close(function() {
                  callback(null, reqs);
                });
              });
            }
          })
        }).listen(17875);
        var c1 = net.createConnection({port: 17874}, function() {
          c1.write("toto");
          c1.end();
        });
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      assert.equal(reqs.length, 1);

      assert.equal(reqs[0].req.method, 'POST');
      assert.equal(reqs[0].req.url, '/pouet');
      assert.equal(reqs[0].body, "toto");
    }
 },
}, 5, 20000).addBatchRetry({
  'net2file': {
    topic: function() {
      var callback = this.callback;
      createAgent([
        'input://tcp://localhost:17874?type=2',
        'output://file://output.txt?serializer=json_logstash',
        ], function(agent) {
        var c = net.createConnection({port: 17874}, function() {
          c.write("toto");
          c.end();
        });
        c.on('end', function() {
          setTimeout(function() {
            agent.close(function() {
              callback(null);
            });
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
      checkResult(splitted[0], {'source': 'tcp_localhost_17874', 'message': 'toto', 'type': '2'});
    }
 },
}, 5, 20000).addBatchRetry({
  'file2statsd': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var received = [];
      var statsd = dgram.createSocket('udp4');
      statsd.on('message', function(d) {
        received.push(d.toString());
      });
      statsd.bind(17874);
      createAgent([
        'input://file://input1.txt',
        'input://file://input2.txt?type=titi',
        'input://file://input3.txt?type=tata',
        'input://file://input4.txt?type=tete',
        'input://file://input5.txt?type=toto',
        'filter://regex://?regex=^45_(.*)$&fields=my_field',
        'output://statsd://127.0.0.1:17874?metric_type=increment&metric_key=toto.bouh',
        'output://statsd://127.0.0.1:17874?metric_type=decrement&metric_key=toto.#{message}&only_type=titi',
        'output://statsd://127.0.0.1:17874?metric_type=counter&metric_key=toto.counter&metric_value=#{message}&only_type=tata',
        'output://statsd://127.0.0.1:17874?metric_type=timer&metric_key=toto.#{my_field}.#{my_field}&metric_value=20&only_type=tete',
        'output://statsd://127.0.0.1:17874?metric_type=gauge&metric_key=toto.gauge&metric_value=45&only_type=toto',
        ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', 'line1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile('input2.txt', 'line2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  fs.appendFile('input3.txt', '10\n', function(err) {
                    assert.ifError(err);
                    setTimeout(function() {
                      fs.appendFile('input4.txt', '45_123\n', function(err) {
                        assert.ifError(err);
                        setTimeout(function() {
                          fs.appendFile('input5.txt', 'line3\n', function(err) {
                            assert.ifError(err);
                            setTimeout(function() {
                              agent.close(function() {
                                statsd.close();
                                callback(undefined, received);
                              });
                            }, 200);
                          });
                        }, 200);
                      });
                    }, 200);
                  });
                }, 200);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err, data) {
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('input3.txt');
      fs.unlinkSync('input4.txt');
      fs.unlinkSync('input5.txt');
      assert.ifError(err);
      assert.deepEqual(data.sort(), [
        'toto.bouh:1|c',
        'toto.line2:-1|c',
        'toto.bouh:1|c',
        'toto.counter:10|c',
        'toto.bouh:1|c',
        'toto.123.123:20|ms',
        'toto.bouh:1|c',
        'toto.bouh:1|c',
        'toto.gauge:45|g',
        ].sort());
      }
   },
 }, 5, 20000).addBatchRetry({
  'file2statsd_missing_field': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var received = [];
      var errors = [];
      var statsd = dgram.createSocket('udp4');
      statsd.on('message', function(d) {
        received.push(d.toString());
      });
      statsd.bind(17874);
      createAgent([
        'input://file://input1.txt',
        'filter://regex://?regex=(line2)&fields=unknown_field',
        'output://statsd://127.0.0.1:17874?metric_type=increment&metric_key=toto.bouh.#{unknown_field}',
        ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', 'line1\n', function(err) {
            assert.ifError(err);
            fs.appendFile('input1.txt', 'line2\n', function(err) {
              assert.ifError(err);
              setTimeout(function() {
                agent.close(function() {
                  statsd.close();
                  callback(errors, received);
                });
              }, 200);
            });
          });
        }, 200);
      }, function(error) {
        errors.push(error);
      });
    },

    check: function(errors, data) {
      fs.unlinkSync('input1.txt');
      assert.deepEqual(data.sort(), ['toto.bouh.line2:1|c'].sort());
      assert.equal(errors.length, 0);
    }
 },
}, 5, 20000).addBatchRetry({
  'file2gelf': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var received = [];
      var gelf = dgram.createSocket('udp4');
      gelf.on('message', function(d) {
        zlib.inflate(d, function(err, data) {
          assert.ifError(err);
          data = JSON.parse(data);
          received.push(data);
        });
      });
      gelf.bind(17874);
      createAgent([
        'input://file://input1.txt?type=toto',
        'filter://compute_field://a?only_type=toto&value=b',
        'input://file://input2.txt',
        'filter://regex://?regex=^\\[(.*)\\]&fields=timestamp&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ',
        'output://gelf://localhost:17874'
        ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', '[31/Jul/2012:18:02:28 +0200] line1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile('input2.txt', '[31/Jul/2012:20:02:28 +0200] line2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  agent.close(function() {
                    gelf.close();
                    callback(undefined, received);
                  });
                }, 200);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err, data) {
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      assert.ifError(err);
      assert.deepEqual(data.sort(), [
       {
        version: '1.0',
        short_message: '[31/Jul/2012:18:02:28 +0200] line1',
        timestamp: (new Date('2012-07-31T16:02:28+00:00')).getTime() / 1000,
        host: os.hostname(),
        facility: 'toto',
        level: '6',
        _a: 'b',
       },
       {
        version: '1.0',
        short_message: '[31/Jul/2012:20:02:28 +0200] line2',
        timestamp: (new Date('2012-07-31T18:02:28+00:00')).getTime() / 1000,
        host: os.hostname(),
        facility: 'no_facility',
        level: '6'
       }
      ].sort());
    }
  },
}, 5, 20000).addBatchRetry({
  'multiline simple test': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      createAgent([
        'input://file://input.txt',
        'filter://multiline://?start_line_regex=^1234',
        'output://file://output.txt?serializer=json_logstash',
        ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input.txt', 'line1\nline2\n1234line3\n1234line4\nline5\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              agent.close(function() {
                callback(null);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('input.txt');
      fs.unlinkSync('output.txt');

      var splitted = c.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal("", splitted[splitted.length - 1]);
      assert.equal(JSON.parse(splitted[0])['message'], "line1\nline2");
      assert.equal(JSON.parse(splitted[1])['message'], "1234line3");
      assert.equal(JSON.parse(splitted[2])['message'], "1234line4\nline5");
    }
  },
}, 5, 20000).addBatch({
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
    'input://tcp://0.0.0.0:abcd'
    ], 'Unable to extract port'),
}).addBatch({
 'input_file_error : root directory not readable': check_error_module([
   'input://file:///root/toto/43input1.txt',
   'output://stdout://'
   ], 'init_error', 'Error: watch EACCES', 'input_file'),
}).addBatch({
  'wrong_output_file_module': check_error_module([
    'output://file:///path_which_does_not_exist/titi.txt'
  ], 'error', 'ENOENT', 'output_file'),
}).addBatchRetry({
  'redis channel transport': file2x2x2file(['output://redis://localhost:6379?channel=toto&db=2'], ['input://redis://localhost:6379?channel=toto&db=4']),
}, 5, 20000).addBatchRetry({
  'redis pattern channel transport': file2x2x2file(['output://redis://localhost:6379?channel=pouet_toto'], ['input://redis://localhost:6379?channel=*toto&pattern_channel=true']),
}, 5, 20000).addBatchRetry({
  'file transport': file2x2x2file(['output://file://main_middle.txt?serializer=json_logstash'], ['input://file://main_middle.txt'], function() { if (fs.existsSync('main_middle.txt')) { fs.unlinkSync('main_middle.txt'); }}),
}, 5, 20000).addBatchRetry({
  'tcp transport': file2x2x2file(['output://tcp://localhost:17874'], ['input://tcp://0.0.0.0:17874']),
}, 5, 20000).addBatchRetry({
  'zeromq transport': file2x2x2file(['output://zeromq://tcp://localhost:17874'], ['input://zeromq://tcp://*:17874']),
}, 5, 20000).addBatchRetry({
  'zeromq transport using msgpack': file2x2x2file(['output://zeromq://tcp://localhost:17874?serializer=msgpack'], ['input://zeromq://tcp://*:17874?unserializer=msgpack']),
}, 5, 20000).addBatchRetry({
  'unix socket transport': file2x2x2file(['output://unix:///tmp/test_socket'], ['input://unix:///tmp/test_socket']),
}, 5, 20000).addBatchRetry({
  'udp transport': file2x2x2file(['output://udp://localhost:17874'], ['input://udp://127.0.0.1:17874']),
}, 5, 20000).export(module);
