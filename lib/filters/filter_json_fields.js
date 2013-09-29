var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterJsonFields() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'JsonFields',
  }
}

util.inherits(FilterJsonFields, base_filter.BaseFilter);

FilterJsonFields.prototype.afterLoadConfig = function(callback) {
  logger.info('Initialized json fields filter');
  callback();
}

FilterJsonFields.prototype.process = function(data) {
  if (!data['@fields']) {
    data['@fields'] = {};
  }

  try {
    var message = data['message'];
    var fields = JSON.parse(message.substring(message.indexOf('{', 0)));
    for (var field in fields) {
      data['@fields'][field] = fields[field];
    }
  }
  catch(e) {
  }

  return data;
}

exports.create = function() {
  return new FilterJsonFields();
}
