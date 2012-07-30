var vows = require('vows'),
    assert = require('assert'),
    url_parser = require('url_parser');

function testExtractProtocol(url, target) {
  return {
    topic: function() {
      this.callback(null, url_parser.extractProtocol(url));
    },

    check: function(result) {
      assert.deepEqual(result, target);
    }
  }
}

function testProcessUrlContent(url, target) {
  return {
    topic: function() {
      this.callback(null, url_parser.processUrlContent(url));
    },

    check: function(result) {
      assert.deepEqual(result, target);
    }
  }
}

function testExtractPortNumber(url, target) {
  return {
    topic: function() {
      this.callback(null, url_parser.extractPortNumber(url));
    },

    check: function(result) {
      assert.deepEqual(result, target);
    }
  }
}

vows.describe('Url parser').addBatch({
  'extract protocol simple': testExtractProtocol('http://www.google.com', {protocol: 'http', next: 'www.google.com'}),
  'extract protocol full path': testExtractProtocol('file:///tmp/toto.txt', {protocol: 'file', next: '/tmp/toto.txt'}),
  'extract protocol zeromq': testExtractProtocol('zeromq://tcp://*:5567', {protocol: 'zeromq', next: 'tcp://*:5567'}),
  'extract protocol qs': testExtractProtocol('file:///toto.txt?type=mon_type&qs=rgr%20abc', {protocol: 'file', next: '/toto.txt?type=mon_type&qs=rgr%20abc'}),
  'extract protocol failed': testExtractProtocol('toto', undefined),
  'extract protocol jsut protocol': testExtractProtocol('stdin://', {protocol: 'stdin', next: ''}),
  'process url content empty': testProcessUrlContent('', undefined),
  'process url content simple': testProcessUrlContent('/tmp/toto.txt', {host: '/tmp/toto.txt', params: {}}),
  'process url content qs': testProcessUrlContent('/tmp/toto.txt?type=t', {host: '/tmp/toto.txt', params: {type: 't'}}),
  'process url content qs special chars': testProcessUrlContent('/tmp/toto.txt?type=t&z=%20t', {host: '/tmp/toto.txt', params: {type: 't', z: ' t'}}),
  'process url content no host': testProcessUrlContent('?type=t&z=%20t', {host: '', params: {type: 't', z: ' t'}}),
  'process url content special chars in host': testProcessUrlContent('/tmp/toto%202.txt?type=t', {host: '/tmp/toto 2.txt', params: {type: 't'}}),
  'extract port number hostonly': testExtractPortNumber('localhost', {host: 'localhost', port: -1}),
  'extract port number ip': testExtractPortNumber('0.0.0.0:80', {host: '0.0.0.0', port: 80}),
  'extract port number host': testExtractPortNumber('www.google.com:8080', {host: 'www.google.com', port: 8080}),
  'extract port number wrong port': testExtractPortNumber('www.google.com:abcd', undefined),
}).export(module);
