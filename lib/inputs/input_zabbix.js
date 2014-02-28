var base_input = require('../lib/base_input'),
  util = require('util'),
  net = require('net'),
  logger = require('log4node');

function InputZabbix() {
  base_input.BaseInput.call(this);
  this.mergeConfig({
    name: 'Zabbix',
    host_field: 'host',
    port_field: 'port',
    required_params: [],
    optional_params: ['type'],
    default_values: {
      'type': 'zabbix'
    },
    start_hook: this.start,
  });
}

util.inherits(InputZabbix, base_input.BaseInput);

InputZabbix.prototype.start = function(callback) {
  logger.info('Start zabbix on', this.host + ':' + this.port);

  this.server = net.createServer(function(socket) {
    var message = new Buffer(0);
    var headerLength = 4 + 1 + 8;
    socket.on('data', function(data) {
      message = Buffer.concat([message, data]);
      if (message.length >= headerLength) {
        // the expected size of the message
        var length = message.readUInt32LE(5);
        // if we received the whole message
        if (length === message.length - headerLength) {
          var ended = false;
          var obj = {
            'message': message.toString('utf-8', headerLength).trim(),
            'host': socket.remoteAddress,
            'tcp_port': this.port,
            'type': this.type,
            'want_response': true,
            data_callback: function(d) {
              // write the response back to the zabbix agent
              socket.write(d);
            },
            end_callback: function() {
              if (ended) {
                return;
              }
              socket.end();
              ended = true;
            }
          };

          this.emit('data', obj);
        }
      }
    }.bind(this));

    socket.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));

  }.bind(this));

  this.server.listen(this.port, this.host);
  this.server.once('listening', callback);
};

InputZabbix.prototype.close = function(callback) {
  logger.info('Closing zabbix', this.host + ':' + this.port);
  this.server.close(callback);
};

exports.create = function() {
  return new InputZabbix();
};
