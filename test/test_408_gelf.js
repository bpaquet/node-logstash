var vows = require('vows-batch-retry'),
  fs = require('fs'),
  os = require('os'),
  path = require('path'),
  zlib = require('zlib'),
  dgram = require('dgram'),
  assert = require('assert'),
  helper = require('./integration_helper.js'),
  monitor_file = require('lib/monitor_file');

vows.describe('Integration gelf :').addBatchRetry({
  'file2gelf': {
    topic: function() {
      monitor_file.setFileStatus({});
      var callback = this.callback;
      var received = [];
      var gelf = dgram.createSocket('udp4');
      gelf.on('message', function(d) {
        zlib.inflate(d, function(err, data) {
          assert.ifError(err);
          data = JSON.parse(data);
          received.push(data);
        });
      });
      gelf.bind(17874);
      helper.createAgent([
        'input://file://input1.txt?type=toto',
        'filter://compute_field://a?only_type=toto&value=b',
        'input://file://input2.txt',
        'filter://regex://?regex=^\\[(.*)\\]&fields=timestamp&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ',
        'output://gelf://localhost:17874'
      ], function(agent) {
        setTimeout(function() {
          fs.appendFile('input1.txt', '[31/Jul/2012:18:02:28 +0200] line1\n', function(err) {
            assert.ifError(err);
            setTimeout(function() {
              fs.appendFile('input2.txt', '[31/Jul/2012:20:02:28 +0200] line2\n', function(err) {
                assert.ifError(err);
                setTimeout(function() {
                  agent.close(function() {
                    gelf.close();
                    callback(undefined, received);
                  });
                }, 200);
              });
            }, 200);
          });
        }, 200);
      });
    },

    check: function(err, data) {
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      assert.ifError(err);
      assert.deepEqual(data.sort(), [{
          version: '1.0',
          short_message: '[31/Jul/2012:18:02:28 +0200] line1',
          timestamp: (new Date('2012-07-31T16:02:28+00:00')).getTime() / 1000,
          host: os.hostname(),
          facility: 'toto',
          level: '6',
          _a: 'b',
          _path: path.resolve('.') + '/input1.txt',
          _type: 'toto',
        },
        {
          version: '1.0',
          short_message: '[31/Jul/2012:20:02:28 +0200] line2',
          timestamp: (new Date('2012-07-31T18:02:28+00:00')).getTime() / 1000,
          host: os.hostname(),
          facility: 'no_facility',
          level: '6',
          _path: path.resolve('.') + '/input2.txt',
        }
      ].sort());
    }
  },
}, 5, 20000).export(module);
