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
  callback(data.message);
};

OutputZabbix.prototype.to = function() {
  return ' zabbix ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputZabbix();
};
