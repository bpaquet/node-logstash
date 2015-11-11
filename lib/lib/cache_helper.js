var lru = require('lru-cache');

function config() {
  return {
    optional_params: [
      'cache_enabled',
      'cache_size',
      'cache_ttl',
    ],
    default_values: {
      'cache_enabled': true,
      'cache_size': 10000,
      'cache_ttl': 60 * 60 * 3,
    },
    start_hook: function(callback) {
      var __cache__;
      if (this.cache_enabled) {
        __cache__ = lru({max: this.cache_size, maxAge: this.cache_ttl * 1000});
      }
      this.cache = function(key, callback) {
        var r;
        if (this.cache_enabled) {
          r = __cache__.get(key);
        }
        if (r) {
          return callback(undefined, r);
        }
        this.cache_miss(key, function(err, r) {
          if (err) {
            return callback(err);
          }
          if (this.cache_enabled) {
            __cache__.set(key, r);
          }
          return callback(undefined, r);
        }.bind(this));
      }.bind(this);
      callback();
    },
  };
}

exports.config = config;
