var vows = require('vows'),
    mock_helper = require('./mock_helper'),
    filter_helper = require('./filter_helper');

function mock_dns() {
  mock_helper.mock({
    'dns': {
      reverse: function(s, cb) {
        if (s === 'www.free.fr') {
          return cb({code: 'ENOTFOUND', errno: 'ENOTFOUND', syscall: 'getHostByAddr'});
        }
        if (s === '212.27.48.10') {
          return cb(null, ['www.free.fr']);
        }
        if (s === '212.27.48.11') {
          return cb(null, ['toto']);
        }
        throw new Error('toto2');
      }
    }
  });
}

function unmock_dns() {
  mock_helper.unmock();
}

vows.describe('Filter reverse dns').addBatch({
  'no_only_hostname': filter_helper.create('reverse_dns', '?only_hostname=false', [
    {'message': 'abcc'},
    {'host': 'www.free.fr'},
    {'host': 'www.free.fr2'},
    {'host': '212.27.48.10'},
    {'host': '212.27.48.11'},
  ], [
    {'message': 'abcc'},
    {'host': 'www.free.fr'},
    {'host': 'www.free.fr2'},
    {'host': 'www.free.fr'},
    {'host': 'toto'},
  ], function() {}, function(callback) {
    mock_dns();
    callback();
  }, function() {
    unmock_dns();
  }),
}).addBatch({
  'only_hostname': filter_helper.create('reverse_dns', '?', [
    {'message': 'abcc'},
    {'host': 'www.free.fr'},
    {'host': 'www.free.fr2'},
    {'host': '212.27.48.10'},
    {'host': '212.27.48.11'},
  ], [
    {'message': 'abcc'},
    {'host': 'www.free.fr'},
    {'host': 'www.free.fr2'},
    {'host': 'www'},
    {'host': 'toto'},
  ], function() {}, function(callback) {
    mock_dns();
    callback();
  }, function() {
    unmock_dns();
  }),
}).export(module);
