var vows = require('vows-batch-retry'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file'),
  redis_driver = require('redis_driver');

function _file2x2x2file(config1, config2, clean_callback, start_callback, stop_callback, check, wait_delay) {
  return {
    topic: function() {
      start_callback = start_callback || function(callback) {
        callback(undefined);
      };
      stop_callback = stop_callback || function(o, callback) {
        callback();
      };
      if (clean_callback) {
        clean_callback();
      }
      var callback = this.callback;
      start_callback(function(o) {
        monitor_file.setFileStatus({});
        helper.createAgent(['input://file://main_input.txt?type=test'].concat(config1), function(a1) {
          helper.createAgent(config2.concat(['output://file://main_output.txt?serializer=json_logstash']), function(a2) {
            setTimeout(function() {
              fs.appendFile('main_input.txt', '234 tgerhe grgh\néè\nline3\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  a1.close(function() {
                    a2.close(function() {
                      stop_callback(o, function() {
                        callback(null);
                      });
                    });
                  });
                }, wait_delay || 200);
              });
            }, 200);
          }, 200);
        });
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
      assert.equal(splitted.length, 4);
      assert.equal('', splitted[splitted.length - 1]);

      check(splitted.slice(0, 3));
    }
  };
}

function file2x2x2fileNotOrdered(config1, config2, clean_callback, start_callback, stop_callback, wait_delay) {
  return _file2x2x2file(config1, config2, clean_callback, start_callback, stop_callback, function(splitted) {
    splitted.sort();
    helper.checkResult(splitted[0], {
      'path': path.resolve('.') + '/main_input.txt',
      'message': '234 tgerhe grgh',
      'type': 'test',
      '@version': '1'
    }, true);
    helper.checkResult(splitted[1], {
      'path': path.resolve('.') + '/main_input.txt',
      'message': 'line3',
      'type': 'test',
      '@version': '1'
    }, true);
    helper.checkResult(splitted[2], {
      'path': path.resolve('.') + '/main_input.txt',
      'message': 'éè',
      'type': 'test',
      '@version': '1'
    }, true);
  }, wait_delay);
}

function file2x2x2file(config1, config2, clean_callback, start_callback, stop_callback, wait_delay) {
  return _file2x2x2file(config1, config2, clean_callback, start_callback, stop_callback, function(splitted) {
    helper.checkResult(splitted[0], {
      'path': path.resolve('.') + '/main_input.txt',
      'message': '234 tgerhe grgh',
      'type': 'test',
      '@version': '1'
    }, true);
    helper.checkResult(splitted[1], {
      'path': path.resolve('.') + '/main_input.txt',
      'message': 'éè',
      'type': 'test',
      '@version': '1'
    }, true);
    helper.checkResult(splitted[2], {
      'path': path.resolve('.') + '/main_input.txt',
      'message': 'line3',
      'type': 'test',
      '@version': '1'
    }, true);
  }, wait_delay);
}

var test = vows.describe('Integration file2x2x2file :').addBatchRetry({
  'redis queue channel transport': file2x2x2file(['output://redis://localhost:17874?key=toto'], ['input://redis://localhost:17874?key=toto'], undefined, function(callback) {
    var r = new redis_driver.RedisDriver();
    r.start({
      port: 17874
    }, function() {
      callback(r);
    });
  }, function(r, callback) {
    r.stop(callback);
  }),
}, 5, 20000).addBatchRetry({
  'redis pubsub channel transport': file2x2x2file(['output://redis://localhost:17874?channel=toto&method=pubsub'], ['input://redis://localhost:17874?channel=toto&method=pubsub'], undefined, function(callback) {
    var r = new redis_driver.RedisDriver();
    r.start({
      port: 17874
    }, function() {
      callback(r);
    });
  }, function(r, callback) {
    r.stop(callback);
  }),
}, 5, 20000).addBatchRetry({
  'redis pubsub channel transport with auth': file2x2x2file(['output://redis://localhost:17874?channel=toto&auth_pass=pass_toto&method=pubsub'], ['input://redis://localhost:17874?channel=toto&auth_pass=pass_toto&method=pubsub'], undefined, function(callback) {
    var r = new redis_driver.RedisDriver();
    r.start({
      port: 17874,
      requirepass: 'pass_toto'
    }, function() {
      callback(r);
    });
  }, function(r, callback) {
    r.stop(callback);
  }),
}, 5, 20000).addBatchRetry({
  'redis pubsub pattern channel transport': file2x2x2file(['output://redis://localhost:17874?channel=pouet_toto&method=pubsub'], ['input://redis://localhost:17874?channel=*toto&pattern_channel=true&method=pubsub'], undefined, function(callback) {
    var r = new redis_driver.RedisDriver();
    r.start({
      port: 17874
    }, function() {
      callback(r);
    });
  }, function(r, callback) {
    r.stop(callback);
  }),
}, 5, 20000).addBatchRetry({
  'file transport': file2x2x2file(['output://file://main_middle.txt?serializer=json_logstash'], ['input://file://main_middle.txt'], function() {
    if (fs.existsSync('main_middle.txt')) {
      fs.unlinkSync('main_middle.txt');
    }
  }),
}, 5, 20000).addBatchRetry({
  'file transport raw input': _file2x2x2file(['output://file://main_middle.txt?serializer=raw'], ['input://file://main_middle.txt?unserializer=raw'], function() {
    if (fs.existsSync('main_middle.txt')) {
      fs.unlinkSync('main_middle.txt');
    }
  }, undefined, undefined, function(l) {
    assert.equal(JSON.parse(l[0]).message, '234 tgerhe grgh');
    assert.equal(JSON.parse(l[1]).message, 'éè');
    assert.equal(JSON.parse(l[2]).message, 'line3');
  }),
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
}, 5, 20000).addBatchRetry({
  'http transport': file2x2x2fileNotOrdered(['output://http_post://localhost:17874?serializer=json_logstash'], ['input://http://127.0.0.1:17874']),
}, 5, 20000).addBatchRetry({
  'https transport': file2x2x2fileNotOrdered(['output://http_post://localhost:17874?serializer=json_logstash&ssl=true&ssl_rejectUnauthorized=false'], ['input://http://127.0.0.1:17874?ssl=true&ssl_key=test/ssl/server.key&ssl_cert=test/ssl/server.crt']),
}, 5, 20000).addBatchRetry({
  'https transport with ca': file2x2x2fileNotOrdered(['output://http_post://localhost:17874?serializer=json_logstash&ssl=true&ssl_ca=test/ssl/root-ca.crt'], ['input://http://127.0.0.1:17874?ssl=true&ssl_key=test/ssl/server.key&ssl_cert=test/ssl/server.crt']),
}, 5, 20000).addBatchRetry({
  'https transport with ca and client side certificate': file2x2x2fileNotOrdered(['output://http_post://localhost:17874?serializer=json_logstash&ssl=true&ssl_ca=test/ssl/root-ca.crt&ssl_key=test/ssl/client.key&ssl_cert=test/ssl/client.crt'], ['input://http://127.0.0.1:17874?ssl=true&ssl_key=test/ssl/server.key&ssl_cert=test/ssl/server.crt&ssl_requestCert=true&ssl_ca=test/ssl/root-ca.crt&ssl_rejectUnauthorized=true']),
}, 5, 20000).addBatchRetry({
  'tls': file2x2x2fileNotOrdered(['output://tcp://localhost:17874?serializer=json_logstash&ssl=true&ssl_rejectUnauthorized=false'], ['input://tcp://127.0.0.1:17874?ssl=true&ssl_key=test/ssl/server.key&ssl_cert=test/ssl/server.crt']),
}, 5, 20000).addBatchRetry({
  'tls with ca': file2x2x2fileNotOrdered(['output://tcp://localhost:17874?serializer=json_logstash&ssl=true&ssl_ca=test/ssl/root-ca.crt&ssl_key=test/ssl/client.key&ssl_cert=test/ssl/client.crt'], ['input://tcp://127.0.0.1:17874?ssl=true&ssl_key=test/ssl/server.key&ssl_cert=test/ssl/server.crt&ssl_requestCert=true&ssl_ca=test/ssl/root-ca.crt&ssl_rejectUnauthorized=true']),
}, 5, 20000).addBatchRetry({
  'rabbitmq standard': file2x2x2file(['output://amqp://localhost:5672?exchange_name=test_node_logstash'], ['input://amqp://localhost:5672?exchange_name=test_node_logstash']),
}, 5, 20000).addBatchRetry({
  'rabbitmq topic': file2x2x2file(['output://amqp://localhost:5672?exchange_name=test_node_logstash_topic&topic=23'], ['input://amqp://localhost:5672?exchange_name=test_node_logstash_topic&topic=23']),
}, 5, 20000);

if (fs.existsSync('.sqs')) {
  var sqs = fs.readFileSync('.sqs').toString().trim();
  test = test.addBatchRetry({
    'sqs': file2x2x2fileNotOrdered(['output://sqs://' + sqs], ['input://sqs://' + sqs], undefined, undefined, undefined, 5000),
  }, 1, 20000);
}

test.export(module);