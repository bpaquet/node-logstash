var vows = require('vows-batch-retry'),
  fs = require('fs'),
  url = require('url'),
  querystring = require('querystring'),
  assert = require('assert'),
  http = require('http'),
  helper = require('./integration_helper.js');

var m1 = {
  http_remote_ip: '8.8.8.8',
  http_path: '/ping?toto=32',
  http_status: 200,
  http_bytes_sent: 146,
  http_referer: '',
  http_user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2145.4 Safari/537.36',
  http_delay: 60,
  http_method: 'GET',
  http_host: 'test.appspot.com',
  cost: 1.6316e-8,
  '@timestamp': '2014-09-10T07:59:43.927+0000',
  request_id: '541014ef00ff0e26606f6190970001737e707573682d696e746567726174696f6e0001312d776172000100',
  message: '8.8.8.8 - - [10/Sep/2014:00:59:43 -0700] "GET /ping?toto=32 HTTP/1.1" 200 146 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2145.4 Safari/537.36"',
};

var m2 = {
  request_id: '541008fd00ff0402e8089aecc60001737e707573682d696e746567726174696f6e0001312d776172000100',
  message: 'poeut',
  log_level: 'INFO',
  '@timestamp': '2014-09-10T08:21:17.323+0000',
};

function mock() {
  var counter = 0;
  var server = http.createServer(function(req, res) {
    var u = url.parse(req.url);
    var qs = querystring.parse(u.query);
    if (qs.log_key !== 'toto') {
      res.writeHead(401);
      return res.end();
    }
    if (counter === 0) {
      counter += 1;
      var s1 = JSON.stringify(m1) + '\n';
      res.writeHead(200, {'x-log-end-timestamp': 666});
      res.write(s1.substring(0, 200));
      res.write(s1.substring(200, 20000));
      return res.end();
    }
    if (counter === 1) {
      if (qs.start_timestamp !== '666') {
        res.writeHead(500);
        return res.end();
      }
      counter += 1;
      var s2 = JSON.stringify(m2) + '\n';
      res.writeHead(200);
      return res.end(s2);
    }
  });
  return server;
}

vows.describe('Integration input gae:').addBatchRetry({
  'input gae': {
    topic: function() {
      var callback = this.callback;
      var server = mock();
      server.listen(56534);
      server.on('listening', function() {
        helper.createAgent([
          'input://gae://localhost:56534?key=toto&polling=1&type=titi',
          'output://file://output1.txt?only_type=titi',
        ], function(agent) {
          setTimeout(function() {
            agent.close(function() {
              server.close(callback);
            });
          }, 1500);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output1.txt').toString();
      fs.unlinkSync('output1.txt');

      var splitted = c1.split('\n');
      assert.equal(splitted.length, 3);

      assert.equal(splitted[0], '8.8.8.8 - - [10/Sep/2014:00:59:43 -0700] "GET /ping?toto=32 HTTP/1.1" 200 146 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2145.4 Safari/537.36"');
      assert.equal(splitted[1], 'poeut');
    }
  },
}, 5, 20000).addBatchRetry({
  'input gae with type': {
    topic: function() {
      var callback = this.callback;
      var server = mock();
      server.listen(56534);
      server.on('listening', function() {
        helper.createAgent([
          'input://gae://localhost:56534?key=toto&polling=1&access_logs_type=toto&access_logs_field_name=http_remote_ip',
          'output://file://output1.txt?only_type=toto',
        ], function(agent) {
          setTimeout(function() {
            agent.close(function() {
              server.close(callback);
            });
          }, 1500);
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output1.txt').toString();
      fs.unlinkSync('output1.txt');

      var splitted = c1.split('\n');
      assert.equal(splitted.length, 2);

      assert.equal(splitted[0], '8.8.8.8 - - [10/Sep/2014:00:59:43 -0700] "GET /ping?toto=32 HTTP/1.1" 200 146 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2145.4 Safari/537.36"');
    }
  },
}, 5, 20000).addBatchRetry({
  'input gae wrong key': {
    topic: function() {
      var callback = this.callback;
      var server = mock();
      server.listen(56534);
      server.on('listening', function() {
        helper.createAgent([
          'input://gae://localhost:56534?key=toto2&polling=1',
          'output://file://output1.txt?only_type=toto',
        ], function(agent) {
          setTimeout(function() {
            agent.close(function() {
              if ( http.globalAgent.sockets['localhost:56534']) {
                http.globalAgent.sockets['localhost:56534'].forEach(function(x) {
                  x.end();
                });
              }
              server.close(function() {
                callback();
              });
            });
          }, 1500);
        }, function() {
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output1.txt').toString();
      fs.unlinkSync('output1.txt');

      var splitted = c1.split('\n');
      assert.equal(splitted.length, 1);
    }
  },
}, 5, 20000).export(module);
