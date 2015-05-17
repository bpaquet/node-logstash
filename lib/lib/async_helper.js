var async = require('async');

exports.chainedCloseAll = function(array, callback) {
  return function(err) {
    if (err) {
      return callback(err);
    }
    async.eachSeries(array, function(e, callback) {
      if (e === undefined) {
        callback();
      }
      else {
        e.close(callback);
      }
    }, callback);
  };
};

exports.call = function() {
  return function(x, callback) {
    x(callback);
  };
};
