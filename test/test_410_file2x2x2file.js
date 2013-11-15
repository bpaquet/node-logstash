var vows = require('vows-batch-retry'),
    assert = require('assert'),
    helper = require('./integration_helper.js'),
    monitor_file = require('../lib/lib/monitor_file');

function file2x2x2file(config1, config2, clean_callback) {
  return {
    topic: function() {
      if (clean_callback) {
        clean_callback();
      }
      monitor_file.setFileStatus({});
      var callback = this.callback;
      helper.createAgent(['input://file://main_input.txt?type=test'].concat(config1), function(a1) {
        helper.createAgent(config2.concat(['output://file://main_output.txt?serializer=json_logstash']), function(a2) {
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
      helper.checkResult(splitted[0], {'path': 'main_input.txt', 'message': '234 tgerhe grgh', 'type': 'test', '@version': '1'}, true);
    }
  }
}

vows.describe('Integration file2x2x2file :').addBatchRetry({
  'redis channel transport': file2x2x2file(['output://redis://localhost:6379?channel=toto'], ['input://redis://localhost:6379?channel=toto']),
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
}, 5, 20000).addBatchRetry({
  'http transport': file2x2x2file(['output://http_post://localhost:17874?serializer=json_logstash'], ['input://http://127.0.0.1:17874']),
}, 5, 20000).addBatchRetry({
  'https transport': file2x2x2file(['output://http_post://localhost:17874?serializer=json_logstash&ssl=true&ssl_rejectUnauthorized=false'], ['input://http://127.0.0.1:17874?ssl=true&ssl_key=ssl/server.key&ssl_cert=ssl/server.crt']),
}, 5, 20000).addBatchRetry({
  'https transport with ca': file2x2x2file(['output://http_post://localhost:17874?serializer=json_logstash&ssl=true&ssl_ca=ssl/root-ca.crt'], ['input://http://127.0.0.1:17874?ssl=true&ssl_key=ssl/server.key&ssl_cert=ssl/server.crt']),
}, 5, 20000).addBatchRetry({
  'https transport with ca and client side certificate': file2x2x2file(['output://http_post://localhost:17874?serializer=json_logstash&ssl=true&ssl_ca=ssl/root-ca.crt&ssl_key=ssl/client.key&ssl_cert=ssl/client.crt'], ['input://http://127.0.0.1:17874?ssl=true&ssl_key=ssl/server.key&ssl_cert=ssl/server.crt&ssl_requestCert=true&ssl_ca=ssl/root-ca.crt&ssl_rejectUnauthorized=true']),
}, 5, 20000).addBatchRetry({
  'tls': file2x2x2file(['output://tcp://localhost:17874?serializer=json_logstash&ssl=true&ssl_rejectUnauthorized=false'], ['input://tcp://127.0.0.1:17874?ssl=true&ssl_key=ssl/server.key&ssl_cert=ssl/server.crt']),
}, 5, 20000).addBatchRetry({
  'tls with ca': file2x2x2file(['output://tcp://localhost:17874?serializer=json_logstash&ssl=true&ssl_ca=ssl/root-ca.crt&ssl_key=ssl/client.key&ssl_cert=ssl/client.crt'], ['input://tcp://127.0.0.1:17874?ssl=true&ssl_key=ssl/server.key&ssl_cert=ssl/server.crt&ssl_requestCert=true&ssl_ca=ssl/root-ca.crt&ssl_rejectUnauthorized=true']),
}, 5, 20000).export(module);