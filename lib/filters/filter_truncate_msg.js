var base_filter = require('../lib/base_filter'),
  util = require('util');

function FilterTruncateMsg() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'TruncateMsg',
    required_params: ['msg_limit']
  });
}

util.inherits(FilterTruncateMsg, base_filter.BaseFilter);

FilterTruncateMsg.prototype.process = function(data) {
  if (data['message']) {
    data['message'] = data['message'].substring(0, this.msg_limit);
  }
  return data;
};

exports.create = function() {
  return new FilterTruncateMsg();
};
