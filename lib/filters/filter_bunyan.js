var base_filter = require('../lib/base_filter'),
  util = require('util');


function parseLevel(level) {
  if (typeof level === 'string') { return level;
  } else if (level >= 60) { return 'FATAL';
  } else if (level >= 50) { return 'ERROR';
  } else if (level >= 40) { return 'WARN';
  } else if (level >= 30) { return 'INFO';
  } else if (level >= 20) { return 'DEBUG';
  } else if (level >= 10) { return 'TRACE';
  }
}

function FilterBunyan() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Bunyan',
  });
}

util.inherits(FilterBunyan, base_filter.BaseFilter);

FilterBunyan.prototype.process = function(data) {
  try {
    var message = data.message;
    var fields = JSON.parse(message.substring(message.indexOf('{', 0)));
    data.bunyan = {};
    for (var field in fields) {
      if (field === 'time' || field === 'v' || field === 'hostname') {
        data.bunyan[field] = fields[field];
      } else if (field === 'msg') {
        data.message = fields.msg;
      } else if (field === 'level') {
        data.level_name = parseLevel(fields.level);
        data.level = fields.level;
      } else {
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
