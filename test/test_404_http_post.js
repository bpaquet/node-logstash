var vows = require('vows-batch-retry'),
    fs = require('fs'),
    http = require('http'),
    net = require('net'),
    assert = require('assert'),
    helper = require('./integration_helper.js'),
    monitor_file = require('../lib/lib/monitor_file');

vows.describe('Integration Http post :').addBatchRetry({
  'http_post test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      var agent = helper.createAgent([
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
}, 5, 20000).export(module);