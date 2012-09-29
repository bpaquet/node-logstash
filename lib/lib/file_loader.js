var fs = require('fs'),
    path = require('path');

function filter(s) {
  var result = [];
  s.toString().split('\n').forEach(function(k) {
    var ss = k.trim();
    if (ss.length > 0 && ss[0] != '#') {
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
    files.sort();
    (function load_list(l, result) {
      if (l.length == 0) {
        return callback(null, result);
      }
      var f = l.shift();
      loadFile(path.join(directory, f), function(err, result2) {
        if (err) {
          return callback(err);
        }
        load_list(l, result.concat(result2));
      });
    })(files, []);
  });
}

exports.loadDirectory = loadDirectory;
