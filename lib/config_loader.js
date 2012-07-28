var fs = require('fs'),
    path = require('path');

function default_config() {
  return {input: {}, output: {}};
}

function load_file_and_merge(filename, config, callback) {
  fs.readFile(filename, function(err, data) {
    if (err) {
      return callback(err, null);
    }
    try {
      var json = JSON.parse(data.toString());
      if (json.input) {
        for(var i in json.input) {
          if (!config.input[i]) {
            config.input[i] = [];
          }
          config.input[i] = config.input[i].concat(json.input[i]);
        }
      }
      if (json.output) {
        for(var i in json.output) {
          if (!config.output[i]) {
            config.output[i] = [];
          }
          config.output[i] = config.output[i].concat(json.output[i]);
        }
      }
      callback(null, config);
    }
    catch(err) {
      return callback(err, null);
    }
  });
}

function load_files(directory, files, config, callback) {
  if (files.length == 0) {
    return callback(null, config);
  }
  var fileName = files.pop();
  if (fileName.match(/\.json$/)) {
    load_file_and_merge(path.join(directory, fileName), config, function(err, result) {
      if (err) {
        return callback(err, null);
      }
      load_files(directory, files, result, callback);
    });
  }
  else {
    load_files(directory, files, config, callback);
  }
}

function load_directory(directory, callback) {
  fs.readdir(directory, function(err, files) {
    if (err) {
      return callback(err, null);
    }
    load_files(directory, files.sort(), default_config(), callback);
  });
}

function load_file(filename, callback) {
  load_file_and_merge(filename, default_config(), callback);
}

module.exports = {
  load_directory: load_directory,
  load_file: load_file
}