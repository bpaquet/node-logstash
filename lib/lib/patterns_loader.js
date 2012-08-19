var fs = require('fs'),
    path = require('path');

var directories = [];

module.exports = {
  add: function(dir) {
    directories.push(dir);
  },
  load: function(file_name) {
    var result = undefined;
    directories.forEach(function(d) {
      var f = path.join(d, file_name);
      if (fs.existsSync(f)) {
        var content = fs.readFileSync(f);
        try {
          result = JSON.parse(content);
        }
        catch(e) {
          throw new Error("Unable to parse file " + file_name + " : " + e);
        }
      }
    });
    if (!result) {
      throw new Error("Pattern file " + file_name + " not found");
    }
    return result;
  },
}