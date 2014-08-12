var abstract_udp = require('./abstract_udp'),
  util = require('util');

function OutputUdp() {
  abstract_udp.AbstractUdp.call(this);
  this.mergeConfig({
    name: 'Udp',
  });
  this.mergeConfig(this.serializer_config());
}

util.inherits(OutputUdp, abstract_udp.AbstractUdp);

OutputUdp.prototype.formatPayload = function(data, callback) {
  callback(new Buffer(this.serialize_data(data)));
};

OutputUdp.prototype.to = function() {
  return ' udp ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputUdp();
};
