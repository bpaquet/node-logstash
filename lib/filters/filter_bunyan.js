var base_filter = require('../lib/base_filter'),
  util = require('util');

// https://github.com/trentm/node-bunyan#levels
function parseLevel(level) {
  if (typeof level === 'string') {
    return level;
  }
  else if (level >= 60) {
    return 'FATAL';
  }
  else if (level >= 50) {
    return 'ERROR';
  }
  else if (level >= 40) {
    return 'WARN';
  }
  else if (level >= 30) {
    return 'INFO';
  }
  else if (level >= 20) {
    return 'DEBUG';
  }
  return 'TRACE';
}

function FilterBunyan() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Bunyan',
  });
}

var map = {
  time: '@timestamp',
  hostname: 'host',
  v: 'bunyan_version',
  name: 'bunyan_app_name',
  msg: 'message',
};

util.inherits(FilterBunyan, base_filter.BaseFilter);

FilterBunyan.prototype.process = function(data) {
  try {
    var message = data.message;
    var fields = JSON.parse(message.substring(message.indexOf('{', 0)));
    for (var field in fields) {
      if (map[field]) {
        data[map[field]] = fields[field];
      }
      else if (field === 'level') {
        data.bunyan_level_name = parseLevel(fields.level);
        data.bunyan_level = fields.level;
      }
      else {
        data[field] = fields[field];
      }
    }
  }
  catch (e) {}

  return data;
};

exports.create = function() {
  return new FilterBunyan();
};
