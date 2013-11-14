var abstract_udp = require('./abstract_udp'),
    util = require('util');

function OutputUdp() {
  abstract_udp.AbstractUdp.call(this);
  this.config.name = 'Udp';
  this.config.optional_params.push('format');
  this.config.optional_params.push('serializer');
  this.config.default_values['format'] = '#{message}';
  this.config.default_values['serializer'] = 'json_logstash';
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
