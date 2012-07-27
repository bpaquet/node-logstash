var fs = require('fs'),
    path = require('path');

function parse(directory, files, config, callback) {
  if (files.length == 0) {
    return callback(null, config);
  }
  var fileName = files.pop();
  if (fileName.match(/\.json$/)) {
    fs.readFile(path.join(directory, fileName), function(err, data) {
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
        parse(directory, files, config, callback);
      }
      catch(err) {
        return callback(err, null);
      }
    });
  }
  else {
    parse(directory, files, config, callback);
  }
}

function load(directory, callback) {
  fs.readdir(directory, function(err, files) {
    if (err) {
      return callback(err, null);
    }
    parse(directory, files.sort(), {input: {}, output: {}}, callback);
  });
}

module.exports = {
  load: load
}