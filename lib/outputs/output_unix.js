var abstract_tcp = require('./abstract_tcp'),
  util = require('util');

function OutputUnix() {
  abstract_tcp.AbstractTcp.call(this);
  this.mergeConfig({
    name: 'Unix',
    host_field: 'unix_socket',
    port_field: -1,
    optional_params: 'delimiter',
    default_values: {
      delimiter: '\n',
    },
  });
  this.mergeConfig(this.serializer_config());
}

util.inherits(OutputUnix, abstract_tcp.AbstractTcp);

OutputUnix.prototype.formatPayload = function(data, callback) {
  callback(new Buffer(this.serialize_data(data) + this.delimiter));
};

OutputUnix.prototype.to = function() {
  return ' unix ' + this.unix_socket;
};

exports.create = function() {
  return new OutputUnix();
};
