var fs = require('fs'),
  async = require('async'),
  logger = require('log4node');

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
      'ssl_handshakeTimeout',
      'ssl_honorCipherOrder',
      'ssl_requestCert',
      'ssl_rejectUnauthorized',
      'ssl_sessionIdContext',
      'ssl_secureProtocol',
    ],
    default_values: {
      'ssl': false,
    },
    start_hook: function(callback) {
      async.eachSeries([
        'ssl_key',
        'ssl_cert',
        'ssl_ca',
        'ssl_crl',
        'ssl_pfx'
      ], function(f, callback) {
        if (this[f]) {
          logger.info('Load SSL file', f, this[f]);
          fs.readFile(this[f], function(err, result) {
            if (err) {
              return callback(err);
            }
            this[f] = result;
            callback();
          }.bind(this));
        }
        else {
          callback();
        }
      }.bind(this), callback);
    },
  };
}

function merge_options(obj, options) {
  for (var x in obj) {
    var result = x.match(/ssl_(.*)/);
    if (result && typeof obj[x] !== 'function') {
      options[result[1]] = obj[x];
    }
  }
  return options;
}

exports.config = config;
exports.merge_options = merge_options;
