var abstract_tcp = require('./abstract_tcp'),
  util = require('util');

function OutputTcp() {
  abstract_tcp.AbstractTcp.call(this);
  this.mergeConfig({
    name: 'Tcp',
    optional_params: 'delimiter',
    default_values: {
      delimiter: '\n',
    },
  });
  this.mergeConfig(this.serializer_config());
}

util.inherits(OutputTcp, abstract_tcp.AbstractTcp);

OutputTcp.prototype.formatPayload = function(data, callback) {
  callback(new Buffer(this.serialize_data(data) + this.delimiter));
};

OutputTcp.prototype.to = function() {
  return ' tcp ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputTcp();
};
