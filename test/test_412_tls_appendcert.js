var vows = require('vows-batch-retry'),
  fs = require('fs'),
  net = require('net'),
  assert = require('assert'),
  helper = require('./integration_helper.js');

vows.describe('Integration tls appendpeercert:').addBatchRetry({
  'tls info': {
    topic: function() {
      var callback = this.callback;
      helper.createAgent([
        'input://tcp://localhost:17874?ssl=true&ssl_key=test/ssl/server.key&ssl_cert=test/ssl/server.crt&ssl_requestCert=true&ssl_ca=test/ssl/root-ca.crt&ssl_rejectUnauthorized=true',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        helper.createAgent([
          'input://tcp://localhost:17873',
          'output://tcp://localhost:17874?serializer=raw&ssl=true&ssl_ca=test/ssl/root-ca.crt&ssl_key=test/ssl/client.key&ssl_cert=test/ssl/client.crt',
        ], function(agent2) {
          var c = net.createConnection({
            port: 17873
          }, function() {
            c.write('toto');
            c.end();
          });
          c.on('end', function() {
            setTimeout(function() {
              agent2.close(function() {
                agent.close(function() {
                  callback(null);
                });
              });
            }, 100);
          });
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');

      var splitted = c1.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal('', splitted[splitted.length - 1]);
      var client_tls_info = {
        authorized: true,
        peer_cert: {
          subject: {
            C: 'FR',
            ST: 'Node-Logstash',
            O: 'Node-Logstash',
            CN: 'client_name'
          },
          issuer: {
            C: 'FR',
            ST: 'Node-Logstash',
            O: 'Node-Logstash',
            CN: 'ca.node-logstash.testing'
          },
          valid_from: 'Nov 15 10:02:44 2013 GMT',
          valid_to: 'Nov 13 10:02:44 2023 GMT',
          fingerprint: '9D:39:A4:D8:B3:02:0E:4E:F5:42:1B:63:D9:86:E3:45:3E:51:A1:84'
        },
      };
      helper.checkResult(splitted[0], {
        '@version': '1',
        'host': '127.0.0.1',
        'tcp_port': 17874,
        'message': 'toto',
        'tls': client_tls_info
      });
    }
  },
}, 5, 20000).addBatchRetry({
  'no appendpeercert': {
    topic: function() {
      var callback = this.callback;
      helper.createAgent([
        'input://tcp://localhost:17874?ssl=true&ssl_key=test/ssl/server.key&ssl_cert=test/ssl/server.crt&ssl_requestCert=true&ssl_ca=test/ssl/root-ca.crt&ssl_rejectUnauthorized=true&appendPeerCert=false',
        'output://file://output.txt?serializer=json_logstash',
      ], function(agent) {
        helper.createAgent([
          'input://tcp://localhost:17873',
          'output://tcp://localhost:17874?serializer=raw&ssl=true&ssl_ca=test/ssl/root-ca.crt&ssl_key=test/ssl/client.key&ssl_cert=test/ssl/client.crt',
        ], function(agent2) {
          var c = net.createConnection({
            port: 17873
          }, function() {
            c.write('toto');
            c.end();
          });
          c.on('end', function() {
            setTimeout(function() {
              agent2.close(function() {
                agent.close(function() {
                  callback(null);
                });
              });
            }, 100);
          });
        });
      });
    },

    check: function(err) {
      assert.ifError(err);
      var c1 = fs.readFileSync('output.txt').toString();
      fs.unlinkSync('output.txt');

      var splitted = c1.split('\n');
      assert.equal(splitted.length, 2);
      assert.equal('', splitted[splitted.length - 1]);
      helper.checkResult(splitted[0], {
        '@version': '1',
        'host': '127.0.0.1',
        'tcp_port': 17874,
        'message': 'toto'
      });
    }
  },
}, 5, 20000).export(module);
