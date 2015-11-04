var abstract_zeromq = require('./abstract_zeromq'),
  util = require('util');

function OutputZeroMQ() {
  abstract_zeromq.AbstractZeroMQ.call(this);
  this.mergeConfig(this.serializer_config());
  this.mergeConfig({
    name: 'ZeroMQ',
  });
}

util.inherits(OutputZeroMQ, abstract_zeromq.AbstractZeroMQ);

OutputZeroMQ.prototype.to = function() {
  return 'Zeromq : ' + this.address;
};

OutputZeroMQ.prototype.formatPayload = function(data, callback) {
  callback(this.serialize_data(data));
};

exports.create = function() {
  return new OutputZeroMQ();
};
