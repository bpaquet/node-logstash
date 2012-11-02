var base_input = require('../lib/base_input'),
    util = require('util'),
    zmq = require('zmq'),
    logger = require('log4node');

function InputZeroMQ() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Tcp',
    host_field: 'target',
    optional_params: ['type', 'topology', 'format'],
    default_values: {
      'topology': '',
      'format': 'json_event'
    }
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
    this.emit('data', this.toEvent(data.toString().trim(), 'zmq+'+this.topology+'://'+this.type+'/'));
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
