var base_output = require('../lib/base_output'),
    util = require('util'),
    zmq = require('zmq'),
    logger = require('log4node');

function OutputZeroMQ() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Zeromq',
    host_field: 'target',
  }
}

util.inherits(OutputZeroMQ, base_output.BaseOutput);

OutputZeroMQ.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to zeromq', this.target);

  this.socket = zmq.socket('push');
  this.socket.connect(this.target);

  callback();
}

OutputZeroMQ.prototype.process = function(data) {
  this.socket.send(JSON.stringify(data));
}

OutputZeroMQ.prototype.close = function(callback) {
  logger.info('Closing output to zeromq', this.target);
  this.socket.close();
  callback();
}

exports.create = function() {
  return new OutputZeroMQ();
}
