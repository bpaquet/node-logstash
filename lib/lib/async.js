
var eachSeries = exports.eachSeries = function(array, f, callback) {
  (function run(index) {
    if (index >= array.length) {
      return callback();
    }
    f(array[index], function(err) {
      if (err) {
        return callback(err);
      }
      run(index + 1);
    });
  })(0);
};

exports.chainedCloseAll = function(array, callback) {
  return function(err) {
    if (err) {
      return callback(err);
    }
    eachSeries(array, function(e, callback) {
      if (e === undefined) {
        callback();
      }
      else {
        e.close(callback);
      }
    }, callback);
  };
};

exports.fold = function(array, f, initial_value, callback) {
  (function run(index, value) {
    if (index >= array.length) {
      return callback(undefined, value);
    }
    f(array[index], value, function(err, new_value) {
      if (err) {
        return callback(err);
      }
      run(index + 1, new_value);
    });
  })(0, initial_value);
};

exports.call = function() {
  return function(x, callback) {
    x(callback);
  };
};
