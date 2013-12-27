var vows = require('vows-batch-retry'),
    http = require('http'),
    net = require('net'),
    assert = require('assert'),
    helper = require('./integration_helper.js');

function createHttpTest(output_url, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=pouet',
        output_url,
      ], function(agent) {
        var http_server = http.createServer(function(req, res) {
          var body = '';
          req.on('data', function(chunk) {
            body += chunk;
          });
          req.on('end', function() {
            reqs.push({req: req, body: body});
            res.writeHead(204);
            res.end();
            if (reqs.length === 1) {
              agent.close(function() {
                http_server.close(function() {
                  callback(null, reqs);
                });
              });
            }
          });
        }).listen(17875);
        var c1 = net.createConnection({port: 17874}, function() {
          c1.write('toto');
          c1.end();
        });
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      assert.equal(reqs.length, 1);

      check_callback(reqs);
    }
  };
}

vows.describe('Integration Http post :').addBatchRetry({
  'http_post test raw': createHttpTest('output://http_post://localhost:17875?path=/#{type}', function(reqs) {
    assert.equal(reqs[0].req.method, 'POST');
    assert.equal(reqs[0].req.headers['content-type'], 'text/plain');
    assert.equal(reqs[0].req.url, '/pouet');
    assert.equal(reqs[0].body, 'toto');
  }),
}, 5, 20000).addBatchRetry({
  'http_post test json': createHttpTest('output://http_post://localhost:17875?path=/#{type}&serializer=json_logstash', function(reqs) {
    assert.equal(reqs[0].req.method, 'POST');
    assert.equal(reqs[0].req.headers['content-type'], 'application/json');
    assert.equal(reqs[0].req.url, '/pouet');
    helper.checkResult(reqs[0].body, {message: 'toto', host: '127.0.0.1', tcp_port: 17874, type: 'pouet', '@version': '1'});
  }),
}, 5, 20000).export(module);