var fs = require('fs'),
  path = require('path'),
  logstash_config = require('../logstash_config'),
  config_mapper = require('./config_mapper'),
  async = require('async');

function filter(logstash_config_processing, s) {
  var result = [];
  if (s.trim() === '') {
    return [];
  }
  if (!logstash_config_processing || s.match('input://') || s.match('output://') || s.match('filter://')) {
    s.split('\n').forEach(function(k) {
      var ss = k.trim();
      if (ss.length > 0 && ss[0] !== '#') {
        result.push(ss);
      }
    });
    return result;
  }
  else {
    return config_mapper.map(logstash_config.parse(s));
  }
}

exports.filter = filter;

function loadFile(filename, logstash_config_processing, callback) {
  if (!callback) {
    callback = logstash_config_processing;
    logstash_config_processing = false;
  }
  fs.readFile(filename, function(err, content) {
    if (err) {
      return callback(err);
    }
    var x;
    try {
      x = filter(logstash_config_processing, content.toString());
    }
    catch(e) {
      callback(new Error('Processing error for file ' + filename + ' : ' + e));
      return;
    }
    callback(null, x);
  });
}

exports.loadFile = loadFile;

function loadDirectory(directory, logstash_config_processing, callback) {
  if (!callback) {
    callback = logstash_config_processing;
    logstash_config_processing = false;
  }
  fs.readdir(directory, function(err, files) {
    if (err) {
      return callback(err);
    }
    async.reduce(files.sort(), [], function(result, f, callback) {
      loadFile(path.join(directory, f), logstash_config_processing, function(err, result2) {
        if (err) {
          return callback(err);
        }
        callback(undefined, result.concat(result2));
      });
    }, callback);
  });
}

exports.loadDirectory = loadDirectory;
