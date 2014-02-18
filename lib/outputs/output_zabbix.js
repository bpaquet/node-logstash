var abstract_tcp = require('./abstract_tcp'),
    util = require('util');

function OutputZabbix() {
  abstract_tcp.AbstractTcp.call(this);
  this.mergeConfig({
    name: 'Zabbix',
    optional_params: [],
    default_values: {
      'only_type': 'zabbix'
    }
  });
  this.mergeConfig(this.serializer_config());
}

util.inherits(OutputZabbix, abstract_tcp.AbstractTcp);

OutputZabbix.prototype.formatPayload = function(data, callback) {
  var length = Buffer.byteLength(data.message, 'utf8');
  var buffer = new Buffer(4 + 1 + 8 + length);
  buffer.write('ZBXD');
  buffer.writeUInt8(0x01, 4);
  buffer.writeUInt32LE(length, 5);
  buffer.writeUInt32LE(0, 9);
  buffer.write(data.message, 13, 'utf8');
  callback(buffer);
};

OutputZabbix.prototype.to = function() {
  return ' zabbix ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputZabbix();
};
