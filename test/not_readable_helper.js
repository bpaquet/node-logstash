var fs = require('fs'),
  rimraf = require('rimraf');

exports.create = function(name) {
  fs.mkdirSync(name);
  fs.chmodSync(name, '0000');
};

exports.remove = function(name) {
  fs.chmodSync(name, '0600');
  rimraf.sync(name);
};