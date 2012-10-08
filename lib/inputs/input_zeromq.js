var base_input = require('../lib/base_input'),
    util = require('util'),
    zmq = require('zmq'),
    logger = require('log4node');

function InputZeroMQ() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Tcp',
    host_field: 'target',
  }
}

util.inherits(InputZeroMQ, base_input.BaseInput);

InputZeroMQ.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on zeromq', this.target);

  this.socket = zmq.socket('pull');
  this.socket.bind(this.target, function(err) {
    if (err) {
      return this.emit('init_error', err);
    }
    logger.info('Zeromq ready on ' + this.target);

    this.emit('init_ok');
  }.bind(this));

  this.socket.on('message', function(data) {
    try {
      var parsed = JSON.parse(data);
      this.emit('data', parsed);
    }
    catch(e) {
      this.emit('error', 'Unable to parse data ' + data);
    }
  }.bind(this));
}

InputZeroMQ.prototype.close = function(callback) {
  logger.info('Closing input zeromq', this.target);
  this.socket.close();
  callback();
}

exports.create = function() {
  return new InputZeroMQ();
}
