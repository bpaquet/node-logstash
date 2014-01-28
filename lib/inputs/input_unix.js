var base_input = require('../lib/base_input'),
  util = require('util'),
  net = require('net'),
  logger = require('log4node');

function InputUnix() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Unix',
    host_field: 'socket',
    optional_params: ['type'],
    start_hook: this.start,
  });
}

util.inherits(InputUnix, base_input.BaseInput);

InputUnix.prototype.start = function(callback) {
  logger.info('Start listening on unix socket', this.socket);

  this.server = net.createServer(function(c) {
    c.on('data', function(data) {
      this.unserialize_data(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        this.emit('data', {
          'message': data.toString().trim(),
          'path': this.socket,
          'type': this.type,
        });
      }.bind(this));
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this));

  this.server.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.server.listen(this.socket, callback);
};

InputUnix.prototype.close = function(callback) {
  logger.info('Closing listening unix socket' + this.socket);
  this.server.close(callback);
};

exports.create = function() {
  return new InputUnix();
};
