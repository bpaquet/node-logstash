var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    mock_helper = require('./mock_helper'),
    filter_helper = require('./filter_helper');

function mock_dns() {
  mock_helper.mock({
    'dns': {
      reverse: function(s, cb) {
        if (s == 'www.free.fr') {
          return cb({code: 'ENOTFOUND', errno: 'ENOTFOUND', syscall: 'getHostByAddr'});
        }
        if (s == '212.27.48.10') {
          return cb(null, ['www.free.fr']);
        }
        if (s == '212.27.48.11') {
          return cb(null, ['toto']);
        }
        throw new Error("toto2");
      }
    }
  });
}

function unmock_dns() {
  mock_helper.unmock();
}

vows.describe('Filter reverse dns').addBatch({
  'no_only_hostname': filter_helper.create('reverse_dns', '?only_hostname=false', [
    {'@message': 'abcc'},
    {'@source_host': 'www.free.fr'},
    {'@source_host': 'www.free.fr2'},
    {'@source_host': '212.27.48.10'},
    {'@source_host': '212.27.48.11'},
  ], [
    {'@message': 'abcc'},
    {'@source_host': 'www.free.fr'},
    {'@source_host': 'www.free.fr2'},
    {'@source_host': 'www.free.fr'},
    {'@source_host': 'toto'},
  ], function() {}, function(callback) {
    mock_dns();
    callback();
  }, function() {
    unmock_dns();
  }),
}).addBatch({
  'only_hostname': filter_helper.create('reverse_dns', '?', [
    {'@message': 'abcc'},
    {'@source_host': 'www.free.fr'},
    {'@source_host': 'www.free.fr2'},
    {'@source_host': '212.27.48.10'},
    {'@source_host': '212.27.48.11'},
  ], [
    {'@message': 'abcc'},
    {'@source_host': 'www.free.fr'},
    {'@source_host': 'www.free.fr2'},
    {'@source_host': 'www'},
    {'@source_host': 'toto'},
  ], function() {}, function(callback) {
    mock_dns();
    callback();
  }, function() {
    unmock_dns();
  }),
}).export(module);