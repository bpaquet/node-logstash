var base_output = require('../lib/base_output'),
  net = require('net'),
  error_buffer = require('../lib/error_buffer'),
  logger = require('log4node'),
  util = require('util');

function OutputZabbix() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(error_buffer.config(function () {
    return 'output zabbix to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig({
    name: 'Zabbix',
    host_field: 'host',
    port_field: 'port',
    start_hook: this.startAbstract,
    optional_params: [],
    default_values: {
      'only_type': 'zabbix'
    }
  });
  this.mergeConfig(this.serializer_config());
}

util.inherits(OutputZabbix, base_output.BaseOutput);

OutputZabbix.prototype.startAbstract = function (callback) {
  logger.info('Start zabbix output to ' + this.host + ':' + this.port);
  callback();
};

OutputZabbix.prototype.formatPayload = function (data, callback) {
  var length = Buffer.byteLength(data.message, 'utf8');
  var buffer = new Buffer(4 + 1 + 8 + length);
  buffer.write('ZBXD');
  buffer.writeUInt8(0x01, 4);
  buffer.writeUInt32LE(length, 5);
  buffer.writeUInt32LE(0, 9);
  buffer.write(data.message, 13);
  callback(buffer);
};

OutputZabbix.prototype.process = function (data) {
  this.formatPayload(data, function (message) {
    var c = net.connect({
      host: this.host,
      port: this.port
    }, function () {
      this.error_buffer.emit('ok');
    }.bind(this));

    var respMessage = new Buffer(0);
    c.on('data', function (d) {
      if (!Buffer.isBuffer(d)) {
        d = new Buffer(d);
      }
      respMessage = Buffer.concat([respMessage, d]);
    }.bind(this));
    c.on('error', function (err) {
      this.error_buffer.emit('error', err);
    }.bind(this));
    c.on('close', function () {
      data.data_callback(respMessage);
    }.bind(this));
    c.end(message);
  }.bind(this));
};

OutputZabbix.prototype.close = function (callback) {
  callback();
};

exports.create = function () {
  return new OutputZabbix();
};
