var vows = require('vows-batch-retry'),
  http = require('http'),
  net = require('net'),
  assert = require('assert'),
  helper = require('./integration_helper.js');

function check_auth(req) {
  var auth = req.headers.authorization;
  if (!auth) {
    return;
  }

  var parts = auth.split(' ');
  if ('basic' !== parts[0].toLowerCase()) {
    return;
  }
  if (!parts[1]) {
    return;
  }
  auth = parts[1];

  auth = new Buffer(auth, 'base64').toString();
  auth = auth.match(/^([^:]*):(.*)$/);
  if (!auth) {
    return;
  }

  return { name: auth[1], pass: auth[2] };
}

function createHttpTest(output_url, check_callback, req_count, user, password) {
  return {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=pouet',
        output_url,
      ], function(agent) {
        var http_server = http.createServer(function(req, res) {
          if (user && password) {
            var a = check_auth(req);
            if (a === undefined || a.name !== 'john' || a.pass !== 'secret') {
              res.writeHead(401, {
                'WWW-Authenticate': 'Basic realm="example"',
                'Connection': 'close',
              });
              res.end();
              agent.close(function() {
                http_server.close(function() {
                  callback(null, reqs);
                });
              });
              return;
            }
          }
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
            if (reqs.length === 1) {
              agent.close(function() {
                http_server.close(function() {
                  callback(null, reqs);
                });
              });
            }
          });
        }).listen(17875);
        var c1 = net.createConnection({
          port: 17874
        }, function() {
          c1.write('toto');
          c1.end();
        });
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      assert.equal(reqs.length, req_count === undefined ? 1 : req_count);

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
    helper.checkResult(reqs[0].body, {
      message: 'toto',
      host: '127.0.0.1',
      tcp_port: 17874,
      type: 'pouet',
      '@version': '1'
    });
  }),
}, 5, 20000).addBatchRetry({
  'http_post auth failed': createHttpTest('output://http_post://localhost:17875?path=/#{type}&serializer=json_logstash', function(reqs) {
    assert.equal(reqs.length, 0);
  }, 0, 'john', 'secret'),
}, 5, 20000).addBatchRetry({
  'http_post wrong password': createHttpTest('output://http_post://localhost:17875?path=/#{type}&serializer=json_logstash&basic_auth_user=john&basic_auth_password=secret2', function(reqs) {
    assert.equal(reqs.length, 0);
  }, 0, 'john', 'secret'),
}, 5, 20000).addBatchRetry({
  'http_post auth ok': createHttpTest('output://http_post://localhost:17875?path=/#{type}&serializer=json_logstash&basic_auth_user=john&basic_auth_password=secret', function(reqs) {
    assert.equal(reqs[0].req.method, 'POST');
    assert.equal(reqs[0].req.headers['content-type'], 'application/json');
    assert.equal(reqs[0].req.url, '/pouet');
    helper.checkResult(reqs[0].body, {
      message: 'toto',
      host: '127.0.0.1',
      tcp_port: 17874,
      type: 'pouet',
      '@version': '1'
    });
  }, 1, 'john', 'secret'),
}, 5, 20000).export(module);
