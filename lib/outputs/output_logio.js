var abstract_tcp = require('./abstract_tcp'),
  util = require('util');

function OutputLogIO() {
  abstract_tcp.AbstractTcp.call(this);
  this.mergeConfig({
    name: 'LogIO',
    optional_params: ['priority'],
    default_values: {
      'priority': 'info',
    }
  });
}

util.inherits(OutputLogIO, abstract_tcp.AbstractTcp);

OutputLogIO.prototype.formatPayload = function(data, callback) {
  var prio = this.replaceByFields(data, this.priority);
  var line = '+log|' + data.host + '|' + (data.type || 'no_type') + '|' + prio + '|' + data.message + '\r\n';
  callback(new Buffer(line));
};

OutputLogIO.prototype.to = function() {
  return ' Log IO ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputLogIO();
};
