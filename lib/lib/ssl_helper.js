var fs = require('fs'),
    logger = require('log4node');

function load_ssl_files(obj, callback, list) {
  if (list === undefined) {
    return load_ssl_files(obj, callback, [
      'ssl_key',
      'ssl_cert',
      'ssl_ca',
      'ssl_crl',
      'ssl_pfx'
    ]);
  }
  if (list.length === 0) {
    return callback();
  }
  var to_check = list.shift();
  if (obj[to_check]) {
    logger.info('Load SSL file', to_check, obj[to_check]);
    fs.readFile(obj[to_check], function(err, result) {
      if (err) {
        return obj.emit('init_error', err);
      }
      obj[to_check] = result;
      load_ssl_files(obj, callback, list);
    });
  }
  else {
    load_ssl_files(obj, callback, list);
  }
}

function config() {
  return {
    optional_params: [
      'ssl',
      'ssl_pfx',
      'ssl_key',
      'ssl_passphrase',
      'ssl_cert',
      'ssl_ca',
      'ssl_crl',
      'ssl_ciphers',
      'ssl_handshakeTimeout'  ,
      'ssl_honorCipherOrder',
      'ssl_requestCert',
      'ssl_rejectUnauthorized',
      'ssl_sessionIdContext',
      'ssl_secureProtocol',
    ],
    default_values: {
      'ssl': false,
    },
    afterLoadConfigHook: function(callback) {
      load_ssl_files(this, callback);
    },
  };
}

function merge_options(obj, options) {
  for(var x in obj) {
    var result = x.match(/ssl_(.*)/);
    if (result && typeof obj[x] !== 'function') {
      options[result[1]] = obj[x];
    }
  }
  return options;
}

exports.config = config;
exports.merge_options = merge_options;
