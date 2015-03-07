var fs = require('fs'),
  path = require('path'),
  async = require('./async'),
  file_loader = require('./file_loader');

var directories = [];

exports.add = function(dir) {
  if (directories.indexOf(dir) === -1) {
    directories.push(dir);
  }
};

exports.load = function(file_name, callback) {
  async.fold(directories, function(d, value, callback) {
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
          callback(undefined, json);
        });
      }
      else {
        callback(undefined, value);
      }
    });
  }, undefined, function(err, result) {
    if (err) {
      return callback(err);
    }
    if (result === undefined) {
      return callback(new Error('Pattern file ' + file_name + ' not found'));
    }
    return callback(undefined, result);
  });
};

exports.loadGrokPatterns = function(callback) {
  async.fold(directories, function(dir, l, callback) {
    var d = dir + '/grok';
    fs.exists(d, function(exists) {
      if (exists) {
        file_loader.loadDirectory(d, function(err, ll) {
          if (err) {
            return callback(err);
          }
          callback(undefined, l.concat(ll));
        });
      }
      else {
        callback(undefined, l);
      }
    });
  }, [], callback);
};