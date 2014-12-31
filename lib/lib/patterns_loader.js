var fs = require('fs'),
  path = require('path'),
  file_loader = require('./file_loader');

var directories = [];

function tryToLoad(dirs, file_name, result, callback) {
  if (dirs.length === 0) {
    return callback(new Error('Pattern file ' + file_name + ' not found'));
  }
  var d = dirs.shift();
  var f = path.join(d, file_name);
  fs.exists(f, function(exists) {
    if (exists) {
      fs.readFile(f, function(err, content) {
        if (err) {
          return callback(err);
        }
        var json;
        try {
          json = JSON.parse(content);
        }
        catch (e) {
          return callback(new Error('Unable to parse file ' + file_name + ' : ' + e));
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
  if (directories.indexOf(dir) === -1) {
    directories.push(dir);
  }
};

exports.load = function(file_name, callback) {
  tryToLoad(directories.slice(0), file_name, undefined, callback);
};

function loadGrok(dirs, l, callback) {
  if (dirs.length === 0) {
    return callback(undefined, l);
  }
  var first = dirs.shift();
  var dir = first + '/grok';
  fs.exists(dir, function(exists) {
    if (exists) {
      file_loader.loadDirectory(first + '/grok', function(err, ll) {
        if (err) {
          return callback(err);
        }
        loadGrok(dirs, l.concat(ll), callback);
      });
    }
    else {
      loadGrok(dirs, l, callback);
    }
  });
}

exports.loadGrokPatterns = function(callback) {
  loadGrok(directories.slice(0), [], callback);
};