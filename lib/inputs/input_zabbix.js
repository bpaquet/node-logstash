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
    var startMessage = '{'.charCodeAt(0);
    var message = null;
    socket.on('data', function(data) {
      if (!message) {
        // look for the start of the json message (begins with a '{' )
        for (var i = 0; i < data.length; i++) {
          if (data[i] === startMessage) {
            message = data.slice(i).toString();
            break;
          }
        }
        // couldn't find the start of the message yet, just continue
        if (!message) {
          return;
        }
      } else {
        message += data.toString();
      }

      // check if we received the complete json message
      try {
        JSON.parse(message);
      } catch (e) {
        return;
      }

      var ended = false;
      var obj = {
        'message': message.trim(),
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
