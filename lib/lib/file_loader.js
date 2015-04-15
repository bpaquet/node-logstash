var fs = require('fs'),
  path = require('path'),
  async = require('./async');

function filter(s) {
  var result = [];
  s.toString().split('\n').forEach(function(k) {
    var ss = k.trim();
    if (ss.length > 0 && ss[0] !== '#') {
      result.push(ss);
    }
  });
  return result;
}

function loadFile(filename, callback) {
  fs.readFile(filename, function(err, content) {
    if (err) {
      return callback(err);
    }
    callback(null, filter(content));
  });
}

exports.loadFile = loadFile;

function loadDirectory(directory, callback) {
  fs.readdir(directory, function(err, files) {
    if (err) {
      return callback(err);
    }
    async.fold(files.sort(), function(f, result, callback) {
      loadFile(path.join(directory, f), function(err, result2) {
        if (err) {
          return callback(err);
        }
        callback(undefined, result.concat(result2));
      });
    }, [], callback);
  });
}

exports.loadDirectory = loadDirectory;
