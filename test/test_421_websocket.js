var vows = require('vows-batch-retry'),
  http = require('http'),
  net = require('net'),
  assert = require('assert'),
  helper = require('./integration_helper.js');

function setupTest(output_url, input_url, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      helper.createAgent([
        input_url,
        'output://http_post://localhost:17876?serializer=json_logstash',
      ], function(agent1) {
        helper.createAgent([
          'input://tcp://0.0.0.0:17874?type=pouet',
          output_url,
        ], function(agent2) {
          var http_server = http.createServer(function(req, res) {
            var body = '';
            req.on('data', function(chunk) {
              body += chunk;
            });
            req.on('end', function() {
              reqs.push({
                req: req,
                body: body
              });
              res.writeHead(204);
              res.end();
              if (reqs.length === 2) {
                agent2.close(function() {
                  agent1.close(function() {
                    http_server.close(function() {
                      callback(null, reqs);
                    });
                  });
                });
              }
            });
          }).listen(17876);
          var c1 = net.createConnection({
            port: 17874
          }, function() {
            c1.write('toto\n');
            setTimeout(function() {
              c1.write('tata\n');
              c1.end();
            }, 10);
          });
        });
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      assert.equal(reqs.length, 2);
      check_callback(reqs);
    }
  };
}

vows.describe('Integration Websocket :').addBatchRetry({
  'websocket test raw': setupTest('output://websocket://127.0.0.1:17875?serializer=raw', 'input://websocket://0.0.0.0:17875?type=wspouet', function(reqs) {
    assert.equal(reqs[0].req.method, 'POST');
    assert.equal(reqs[0].req.headers['content-type'], 'application/json');
    helper.checkResult(reqs[0].body, {
      message: 'toto',
      host: '127.0.0.1',
      ws_port: 17875,
      type: 'wspouet',
      '@version': '1'
    });
    assert.equal(reqs[1].req.method, 'POST');
    assert.equal(reqs[1].req.headers['content-type'], 'application/json');
    helper.checkResult(reqs[1].body, {
      message: 'tata',
      host: '127.0.0.1',
      ws_port: 17875,
      type: 'wspouet',
      '@version': '1'
    });
  }),
}, 5, 20000).addBatchRetry({
    'websocket test json': setupTest('output://websocket://localhost:17875?serializer=json_logstash', 'input://websocket://localhost:17875', function(reqs) {
      assert.equal(reqs[0].req.method, 'POST');
      assert.equal(reqs[0].req.headers['content-type'], 'application/json');
      helper.checkResult(reqs[0].body, {
        message: 'toto',
        host: '127.0.0.1',
        tcp_port: 17874,
        type: 'pouet',
        '@version': '1'
      });
      assert.equal(reqs[1].req.method, 'POST');
      assert.equal(reqs[1].req.headers['content-type'], 'application/json');
      helper.checkResult(reqs[1].body, {
        message: 'tata',
        host: '127.0.0.1',
        tcp_port: 17874,
        type: 'pouet',
        '@version': '1'
      });
    }),
  }, 5, 20000).export(module);
