var abstract_tcp = require('./abstract_tcp'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputTcp() {
  abstract_tcp.AbstractTcp.call(this);
  this.config.name = 'Tcp';
  this.config.optional_params.push('format');
  this.config.optional_params.push('serializer');
  this.config.default_values['format'] = '#{message}';
  this.config.default_values['serializer'] = 'json_logstash';
}

util.inherits(OutputTcp, abstract_tcp.AbstractTcp);

OutputTcp.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(function() {
    this.configure_serialize(this.serializer, this.format);
    callback();
  }.bind(this));
}

OutputTcp.prototype.format_payload = function(data, callback) {
  callback(new Buffer(this.serialize_data(data)));
}

OutputTcp.prototype.to = function() {
  return ' tcp ' + this.host + ':' + this.port;
}

exports.create = function() {
  return new OutputTcp();
}
