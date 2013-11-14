var abstract_udp = require('./abstract_udp'),
    util = require('util');

function OutputUdp() {
  abstract_udp.AbstractUdp.call(this);
  this.merge_config({
    name: 'Udp',
    optional_params: ['format', 'serializer'],
    default_values: {
      'format': '#{message}',
      'serializer': 'json_logstash',
    }
  });
}

util.inherits(OutputUdp, abstract_udp.AbstractUdp);

OutputUdp.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(function() {
    this.configure_serialize(this.serializer, this.format);
    callback();
  }.bind(this));
}

OutputUdp.prototype.format_payload = function(data, callback) {
  callback(new Buffer(this.serialize_data(data)));
}

OutputUdp.prototype.to = function() {
  return ' udp ' + this.host + ':' + this.port;
}

exports.create = function() {
  return new OutputUdp();
}
