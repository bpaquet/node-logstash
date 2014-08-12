var base_filter = require('../lib/base_filter'),
  util = require('util');

function FilterJsonFields() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'JsonFields',
  });
}

util.inherits(FilterJsonFields, base_filter.BaseFilter);

FilterJsonFields.prototype.process = function(data) {
  try {
    var message = data.message;
    var fields = JSON.parse(message.substring(message.indexOf('{', 0)));
    for (var field in fields) {
      data[field] = fields[field];
    }
  }
  catch (e) {}

  return data;
};

exports.create = function() {
  return new FilterJsonFields();
};
