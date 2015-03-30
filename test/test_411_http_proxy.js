var vows = require('vows-batch-retry'),
  http = require('http'),
  net = require('net'),
  os = require('os'),
  assert = require('assert'),
  helper = require('./integration_helper.js');

function createHttpTest(config, check_callback, full_check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      var error;
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=pouet',
        'output://' + config,
      ], function(agent) {
        var http_server = http.createServer(function(req, res) {
          var body = '';
          req.on('data', function(chunk) {
            body += chunk;
          });
          req.on('end', function() {
            res.writeHead(204, {
              'Connection': 'close'
            });
            res.end();
            agent.close(function() {
              http_server.close(function() {
                setTimeout(function() {
                  callback(error, {
                    req: req,
                    body: body
                  });
                }, 100);
              });
            });
          });
        }).listen(17875);
        var c1 = net.createConnection({
          port: 17874
        }, function() {
          c1.write('toto');
          c1.end();
        });
      }, function(err) {
        error = err;
      });
    },

    check: function(err, reqs) {
      if (full_check_callback) {
        full_check_callback(err, reqs);
      }
      else {
        assert.ifError(err);
        check_callback(reqs);
      }
    }
  };
}

function createConnectTest(config, check_callback) {
  return {
    topic: function() {
      var callback = this.callback;
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=pouet',
        'output://' + config,
      ], function(agent) {
        var http_server = http.createServer(function() {
          assert.fail('should not be there');
        }).listen(17875);
        http_server.on('connect', function(req, socket) {
          socket.write('HTTP/1.0 200 Connection established\r\n\r\n');
          socket.destroy();
          agent.close(function() {
            http_server.close(function() {
              callback(null, {
                req: req
              });
            });
          });
        });
        var c1 = net.createConnection({
          port: 17874
        }, function() {
          c1.write('toto');
          c1.end();
        });
      }, function(err) {
        callback(err);
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      check_callback(reqs);
    }
  };
}

if (process.version.match(/v0.10.*/)) {
  vows.describe('Integration Http proxy :').addBatchRetry({
    'no proxy': createHttpTest('http_post://localhost:17875?path=/#{type}', function(req) {
      assert.equal(req.req.method, 'POST');
      assert.equal(req.req.url, '/pouet');
      assert.equal(req.body, 'toto');
      assert.equal(req.req.headers['proxy-authorization'], undefined);
    }),
  }, 5, 20000).addBatchRetry({
    'no proxy elastic search': createHttpTest('elasticsearch://localhost:17875', function(req) {
      assert.equal(req.req.method, 'POST');
      assert.match(req.req.url, /logstash.*logs/);
      assert.equal(req.req.headers['proxy-authorization'], undefined);
    }),
  }, 5, 20000).addBatchRetry({
    'http proxy': createHttpTest('http_post://toto.com:1234?path=/#{type}&proxy=http://localhost:17875', function(req) {
      assert.equal(req.req.method, 'POST');
      assert.equal(req.req.url, 'http://toto.com:1234/pouet');
      assert.equal(req.body, 'toto');
      assert.equal(req.req.headers['proxy-authorization'], undefined);
    }),
  }, 5, 20000).addBatchRetry({
    'http proxy elastic search': createHttpTest('elasticsearch://toto.com:1234?proxy=http://localhost:17875', function(req) {
      assert.equal(req.req.method, 'POST');
      assert.match(req.req.url, /http:\/\/toto.com:1234\/logstash.*logs/);
      assert.equal(req.req.headers['proxy-authorization'], undefined);
    }),
  }, 5, 20000).addBatchRetry({
    'http proxy basic auth': createHttpTest('http_post://toto.com:1234?path=/#{type}&proxy=http://a:bc@localhost:17875', function(req) {
      assert.equal(req.req.method, 'POST');
      assert.equal(req.req.url, 'http://toto.com:1234/pouet');
      assert.equal(req.body, 'toto');
      assert.equal(req.req.headers['proxy-authorization'], 'Basic YTpiYw==');
    }),
  }, 5, 20000).addBatchRetry({
    'http proxy basic auth base 64': createHttpTest('http_post://toto.com:1234?path=/#{type}&proxy=http://YTpiYw==@localhost:17875', function(req) {
      assert.equal(req.req.method, 'POST');
      assert.equal(req.req.url, 'http://toto.com:1234/pouet');
      assert.equal(req.body, 'toto');
      assert.equal(req.req.headers['proxy-authorization'], 'Basic YTpiYw==');
    }),
  }, 5, 20000).addBatchRetry({
    'https proxy': createConnectTest('http_post://toto.com:1234?path=/#{type}&ssl=true&proxy=http://localhost:17875', function(req) {
      assert.equal(req.req.method, 'CONNECT');
      assert.equal(req.req.url, 'toto.com:1234');
      assert.equal(req.req.headers['proxy-authorization'], undefined);
    }),
  }, 5, 20000).addBatchRetry({
    'https proxy basic auth': createConnectTest('http_post://toto.com:1234?path=/#{type}&ssl=true&proxy=http://a:bc@localhost:17875', function(req) {
      assert.equal(req.req.method, 'CONNECT');
      assert.equal(req.req.url, 'toto.com:1234');
      assert.equal(req.req.headers['proxy-authorization'], 'Basic YTpiYw==');
    }),
  }, 5, 20000).addBatchRetry({
    'http ntlm no hostname': createHttpTest('http_post://toto.com:1234?path=/#{type}&ssl=true&proxy=http://ntlm:mydomain::a:bc@localhost:17875', undefined, function(err, req) {
      assert.match(err.toString(), /did not receive NTLM type 2 message/);
      assert.equal(req.req.method, 'GET');
      assert.equal(req.req.url, 'http://toto.com:1234/pouet');
      var auth = req.req.headers['proxy-authorization'];
      assert.match(auth, /^NTLM (.*)/);
      var res = auth.match(/^NTLM (.*)/);
      var body = (new Buffer(res[1], 'base64')).toString();
      var l = (os.hostname() + 'mydomain').toUpperCase();
      assert.match(body, new RegExp(l + '$'));
    }),
  }, 5, 20000).addBatchRetry({
    'http ntlm with workstation': createHttpTest('http_post://toto.com:1234?path=/#{type}&ssl=true&proxy=http://ntlm:mydomain:titi:a:bc@localhost:17875', undefined, function(err, req) {
      assert.match(err.toString(), /did not receive NTLM type 2 message/);
      assert.equal(req.req.method, 'GET');
      assert.equal(req.req.url, 'http://toto.com:1234/pouet');
      var auth = req.req.headers['proxy-authorization'];
      assert.match(auth, /^NTLM (.*)/);
      var res = auth.match(/^NTLM (.*)/);
      var body = (new Buffer(res[1], 'base64')).toString();
      var l = ('titi' + 'mydomain').toUpperCase();
      assert.match(body, new RegExp(l + '$'));
    }),
  }, 5, 20000).export(module);
}
