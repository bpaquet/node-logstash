var vows = require('vows-batch-retry'),
  assert = require('assert'),
  fs = require('fs'),
  logger = require('log4node'),
  logstash_config = require('logstash_config'),
  config_mapper = require('lib/config_mapper'),
  patterns_loader = require('../lib/lib/patterns_loader'),
  async = require('async'),
  agent = require('agent');

patterns_loader.add('lib/patterns');

function make_test(config_file, input, output_callback) {
  var r = {};
  r[config_file] = {
    topic: function() {
      var config = fs.readFileSync('test/test_421_logstash/base').toString() + '\n' + fs.readFileSync('test/test_421_logstash/' + config_file).toString();
      var c = logstash_config.parse(config);
      var a = agent.create();
      var callback = this.callback;
      fs.writeFileSync('input.txt', '');
      a.on('error', function(err) {
        logger.error(err);
        assert.ifError(err);
      });
      a.start(config_mapper.map(c), function(err) {
        assert.ifError(err);
        setTimeout(function() {
          async.eachSeries(input, function(x, callback) {
            fs.appendFile('input.txt', x + '\n', function(err) {
              if (err) {
                return callback(err);
              }
              setTimeout(callback, 50);
            });
          }, function() {
            setTimeout(function() {
              a.close(callback);
            }, 200);
          });
        }, 200);
      });
    },
    check: function(err) {
      assert.ifError(err);
      fs.unlinkSync('input.txt');
      var output = fs.readFileSync('output.txt');
      fs.unlinkSync('output.txt');
      var lines = output.toString().split('\n');
      lines.pop();
      output_callback(lines.map(function(x) {
        return JSON.parse(x);
      }));
    }
  };
  return r;
}

vows.describe('Logstash integration tests').addBatch(
//   make_test('simple', [
//     'abcd',
//     'defg',
//   ], function(l) {
//     assert.equal(2, l.length);
//     assert.equal('abcd', l[0].message);
//     assert.equal('defg', l[1].message);
//   })
// ).addBatch(
//   make_test('simple_if', [
//     'abcd',
//     'defg',
//   ], function(l) {
//     assert.equal(1, l.length);
//     assert.equal('defg', l[0].message);
//   })
// ).addBatch(
//   make_test('grep', [
//     'abcd',
//     'defg',
//   ], function(l) {
//     assert.equal(1, l.length);
//     assert.equal('defg', l[0].message);
//   })
// ).addBatch(
//   make_test('if_regex', [
//     'abcd',
//     'defgab',
//     'hjh',
//   ], function(l) {
//     assert.equal(l.length, 2);
//     assert.equal('abcd', l[0].message);
//     assert.equal('defgab', l[1].message);
//   })
// ).addBatch(
//   make_test('else_else_if', [
//     'abcd',
//     'defgab',
//     'hjh',
//   ], function(l) {
//     assert.equal(l.length, 3);
//     assert.equal('tata', l[0].toto);
//     assert.equal('titi', l[1].toto);
//     assert.equal('tutu', l[2].toto);
//   })
// ).addBatch(
//   make_test('upper', [
//     '12',
//     '42',
//     'abcd',
//   ], function(l) {
//     assert.equal(l.length, 3);
//     assert.equal(undefined, l[0].toto);
//     assert.equal('tata', l[1].toto);
//     assert.equal(undefined, l[2].toto);
//   })
// ).addBatch(
//   make_test('regex', [
//     'atitib67c',
//     'Sep 14 02:01:37 lb haproxy[11223]: 127.0.0.1:12345 [14/Sep/2014:02:01:37.452] public nginx/server1 0/0/0/5/5 200 490 - - ---- 1269/1269/0/1/0 0/0 "GET /my/path HTTP/1.1"'
//   ], function(l) {
//     assert.equal(l.length, 2);
//     assert.equal('titi', l[0].toto);
//     assert.equal(67, l[0].tata);
//     assert.equal('haproxy', l[1].syslog_program);
//     assert.equal(11223, l[1].syslog_pid);
//   })
// ).addBatch(
  make_test('fields_tags_1', [
    'abcd',
    '1.2.3.4',
  ], function(l) {
    assert.equal(2, l.length);
    assert.equal('abcd', l[0].message);
    assert.isUndefined(l[0].a);
    assert.equal('1.2.3.4', l[1].message);
    assert.deepEqual([ 'a', 'b' ], l[1].tags);
    assert.equal('b', l[1].a);
  })
).addBatch(
  make_test('fields_tags_2', [
    'abcd',
    '1.2.3.4',
  ], function(l) {
    assert.equal(2, l.length);
    assert.equal('abcd', l[0].message);
    assert.isUndefined(l[0].a);
    assert.equal('1.2.3.4', l[1].message);
    assert.deepEqual([ 'a', 'b' ], l[1].tags);
    assert.equal('b', l[1].a);
    assert.equal('d', l[1].c);
  })
).addBatch(
  make_test('fields_tags_3', [
    'abcd',
    '1.2.3.4',
  ], function(l) {
    assert.equal(2, l.length);
    assert.equal('abcd', l[0].message);
    assert.isUndefined(l[0].a);
    assert.equal('1.2.3.4', l[1].message);
    assert.deepEqual([ 'toto' ], l[1].tags);
    assert.equal('b', l[1].a);
    assert.equal('d', l[1].c);
  })
).export(module);
