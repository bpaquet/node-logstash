var fs = require('fs'),
    path = require('path');

var directories = [];

function tryToLoad(dirs, file_name, result, callback) {
  if (dirs.length == 0) {
    return callback(new Error("Pattern file " + file_name + " not found"));
  }
  var d = dirs.shift();
  var f = path.join(d, file_name);
  fs.exists(f, function(exists) {
    if (exists) {
      fs.readFile(f, function(err, content) {
        if (err) {
          return callback(err);
        }
        var json = undefined;
        try {
          json = JSON.parse(content);
        }
        catch(e) {
            return callback(new Error("Unable to parse file " + file_name + " : " + e));
        }
        callback(null, json);
      });
    }
    else {
      tryToLoad(dirs, file_name, result, callback);
    }
  });
}

exports.add = function(dir) {
  directories.push(dir);
}

exports.load = function(file_name, callback) {
  tryToLoad(directories.slice(0), file_name, undefined, callback);
}