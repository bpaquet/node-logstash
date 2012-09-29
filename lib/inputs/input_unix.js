var base_input = require('../lib/base_input'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node');

function InputUnix() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Unix',
    host_field: 'socket',
    optional_params: ['type'],
  }
}

util.inherits(InputUnix, base_input.BaseInput);

InputUnix.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on unix socket', this.socket);

  this.server = net.createServer(function(c) {
    c.on('data', function(data) {
      try {
      var parsed = JSON.parse(data);
        this.emit('data', parsed);
      }
      catch(e) {
        this.emit('data', {
          '@message': data.toString().trim(),
          '@source': 'unix_' + this.socket,
          '@type': this.type,
        });
      }
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this)).listen(this.socket, callback);
}

InputUnix.prototype.close = function(callback) {
  logger.info('Closing listening unix socket' + this.socket);
  this.server.close(callback);
}

exports.create = function() {
  return new InputUnix();
}