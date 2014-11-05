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
            reqs.push({
              req: req,
              body: body
            });
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
        var c1 = net.createConnection({
          port: 17874
        }, function() {
          c1.write('toto');
          c1.end();
        });
        setTimeout(function() {
          var c2 = net.createConnection({
            port: 17875
          }, function() {
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
      assert.match(reqs[0].req.url, new RegExp('^\/logstash-' + (new Date()).getUTCFullYear() + '\\.\\d\\d\\.\\d\\d\/logs'));
      helper.checkResult(reqs[0].body, {
        '@version': '1',
        'message': 'toto',
        'host': '127.0.0.1',
        'type': 'nginx',
        'tcp_port': 17874
      });

      assert.equal(reqs[1].req.method, 'POST');
      assert.match(reqs[1].req.url, new RegExp('^\/logstash-' + (new Date()).getUTCFullYear() + '\\.\\d\\d\\.\\d\\d\/logs'));
      helper.checkResult(reqs[1].body, {
        '@version': '1',
        'message': 'titi',
        'host': '127.0.0.1',
        'tcp_port': 17875
      });
    }
  },

  'elastic_search with custom data type and index test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=nginx',
        'input://tcp://0.0.0.0:17875',
        'output://elasticsearch://localhost:17876?data_type=audits&index_type=audit',
      ], function(agent) {
        var es_server = http.createServer(function(req, res) {
          var body = '';
          req.on('data', function(chunk) {
            body += chunk;
          });
          req.on('end', function() {
            reqs.push({
              req: req,
              body: body
            });
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
        var c1 = net.createConnection({
          port: 17874
        }, function() {
          c1.write('toto');
          c1.end();
        });
        setTimeout(function() {
          var c2 = net.createConnection({
            port: 17875
          }, function() {
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
      assert.match(reqs[0].req.url, new RegExp('^\/audit-' + (new Date()).getUTCFullYear() + '\\.\\d\\d\\.\\d\\d\/audits'));
      helper.checkResult(reqs[0].body, {
        '@version': '1',
        'message': 'toto',
        'host': '127.0.0.1',
        'type': 'nginx',
        'tcp_port': 17874
      });

      assert.equal(reqs[1].req.method, 'POST');
      assert.match(reqs[1].req.url, new RegExp('^\/audit-' + (new Date()).getUTCFullYear() + '\\.\\d\\d\\.\\d\\d\/audits'));
      helper.checkResult(reqs[1].body, {
        '@version': '1',
        'message': 'titi',
        'host': '127.0.0.1',
        'tcp_port': 17875
      });
    }
  },

  'elastic_search bulk timer test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=nginx',
        'input://tcp://0.0.0.0:17875?type=haproxy',
        'input://tcp://0.0.0.0:17876?type=stud',
        'output://elasticsearch://localhost:17877?bulk=true&bulk_timeout=500&data_type=audits&index_type=audit',
      ], function(agent) {
        var es_server = http.createServer(function(req, res) {
          var body = '';
          req.on('data', function(chunk) {
            body += chunk;
          });
          req.on('end', function() {
            reqs.push({
              req: req,
              body: body
            });
            res.writeHead(201);
            res.end();
            if (reqs.length === 1) {
              agent.close(function() {
                es_server.close(function() {
                  callback(null, reqs);
                });
              });
            }
          });
        }).listen(17877);
        var c1 = net.createConnection({
          port: 17874
        }, function() {
          c1.write('toto');
          c1.end();
        });
        setTimeout(function() {
          var c2 = net.createConnection({
            port: 17875
          }, function() {
            c2.write('titi');
            c2.end();
          });
        }, 100);
        setTimeout(function() {
          var c2 = net.createConnection({
            port: 17876
          }, function() {
            c2.write('tata');
            c2.end();
          });
        }, 200);
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      assert.equal(reqs.length, 1);

      assert.equal(reqs[0].req.method, 'POST');
      assert.match(reqs[0].req.url, new RegExp('^\/audit-' + (new Date()).getUTCFullYear() + '\\.\\d\\d\\.\\d\\d\/audits\/_bulk'));
      var lines = reqs[0].body.split('\n');
      helper.checkResult(lines[0], {
        'index': {}
      });
      helper.checkResult(lines[1], {
        '@version': '1',
        'message': 'toto',
        'host': '127.0.0.1',
        'type': 'nginx',
        'tcp_port': 17874
      });
      helper.checkResult(lines[2], {
        'index':{}
      });
      helper.checkResult(lines[3], {
        '@version': '1',
        'message': 'titi',
        'host': '127.0.0.1',
        'type': 'haproxy',
        'tcp_port': 17875
      });
      helper.checkResult(lines[4], {
        'index':{}
      });
      helper.checkResult(lines[5], {
        '@version': '1',
        'message': 'tata',
        'host': '127.0.0.1',
        'type': 'stud',
        'tcp_port': 17876
      });
    }
  },

  'elastic_search bulk limit test': {
    topic: function() {
      var callback = this.callback;
      var reqs = [];
      helper.createAgent([
        'input://tcp://0.0.0.0:17874?type=nginx',
        'input://tcp://0.0.0.0:17875?type=haproxy',
        'input://tcp://0.0.0.0:17876?type=stud',
        'output://elasticsearch://localhost:17877?bulk=true&bulk_timeout=500&bulk_limit=2&data_type=audits&index_type=audit',
      ], function(agent) {
        var es_server = http.createServer(function(req, res) {
          var body = '';
          req.on('data', function(chunk) {
            body += chunk;
          });
          req.on('end', function() {
            reqs.push({
              req: req,
              body: body
            });
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
        }).listen(17877);
        var c1 = net.createConnection({
          port: 17874
        }, function() {
          c1.write('toto');
          c1.end();
        });
        setTimeout(function() {
          var c2 = net.createConnection({
            port: 17875
          }, function() {
            c2.write('titi');
            c2.end();
          });
        }, 100);
        setTimeout(function() {
          var c2 = net.createConnection({
            port: 17876
          }, function() {
            c2.write('tata');
            c2.end();
          });
        }, 200);
      });
    },

    check: function(err, reqs) {
      assert.ifError(err);
      assert.equal(reqs.length, 2);

      assert.equal(reqs[0].req.method, 'POST');
      assert.match(reqs[0].req.url, new RegExp('^\/audit-' + (new Date()).getUTCFullYear() + '\\.\\d\\d\\.\\d\\d\/audits\/_bulk'));
      var lines = reqs[0].body.split('\n').filter(function(line) {return line.length > 0;});
      assert.equal(lines.length, 4);
      helper.checkResult(lines[0], {
        'index': {}
      });
      helper.checkResult(lines[1], {
        '@version': '1',
        'message': 'toto',
        'host': '127.0.0.1',
        'type': 'nginx',
        'tcp_port': 17874
      });
      helper.checkResult(lines[2], {
        'index':{}
      });
      helper.checkResult(lines[3], {
        '@version': '1',
        'message': 'titi',
        'host': '127.0.0.1',
        'type': 'haproxy',
        'tcp_port': 17875
      });

      assert.equal(reqs[1].req.method, 'POST');
      assert.match(reqs[1].req.url, new RegExp('^\/audit-' + (new Date()).getUTCFullYear() + '\\.\\d\\d\\.\\d\\d\/audits\/_bulk'));
      lines = reqs[1].body.split('\n').filter(function(line) {return line.length > 0;});
      assert.equal(lines.length, 2);
      helper.checkResult(lines[0], {
        'index': {}
      });
      helper.checkResult(lines[1], {
        '@version': '1',
        'message': 'tata',
        'host': '127.0.0.1',
        'type': 'stud',
        'tcp_port': 17876
      });
    }
  }
}, 5, 20000).export(module);
