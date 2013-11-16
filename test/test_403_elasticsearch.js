var vows = require('vows-batch-retry'),
    http = require('http'),
    net = require('net'),
    assert = require('assert'),
    helper = require('./integration_helper.js');

vows.describe('Integration Elastic search event :').addBatchRetry({
  'elastic_search test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=nginx',
        'input://tcp://0.0.0.0:17875',
        'output://elasticsearch://localhost:17876',
      ], function(agent) {
        var es_server = http.createServer(function(req, res) {
          var body = '';
          req.on('data', function(chunk) {
            body += chunk;
          });
          req.on('end', function() {
            reqs.push({req: req, body: body});
            res.writeHead(201);
            res.end();
            if (reqs.length === 2) {
              agent.close(function() {
                es_server.close(function() {
                  callback(null, reqs);
                });
              });
            }
          });
        }).listen(17876);
        var c1 = net.createConnection({port: 17874}, function() {
          c1.write('toto');
          c1.end();
        });
        setTimeout(function() {
          var c2 = net.createConnection({port: 17875}, function() {
            c2.write('titi');
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
      helper.checkResult(reqs[0].body, {'@version': '1', 'message': 'toto', 'host': '127.0.0.1', 'type': 'nginx', 'tcp_port': 17874});

      assert.equal(reqs[1].req.method, 'POST');
      assert(reqs[1].req.url.match('^\/logstash-' + (new Date()).getFullYear() + '\\.\\d\\d\\.\\d\\d\/data'), reqs[1].req.url + ' does not match regex');
      helper.checkResult(reqs[1].body, {'@version': '1', 'message': 'titi', 'host': '127.0.0.1', 'tcp_port': 17875});
    }
  },
}, 5, 20000).export(module);