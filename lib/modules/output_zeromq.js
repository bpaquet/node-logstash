var events = require('events'),
    util = require('util'),
    zmq = require('zmq');

function OutputZeroMQ() {
  events.EventEmitter.call(this);
}

util.inherits(OutputZeroMQ, events.EventEmitter);

OutputZeroMQ.prototype.init = function(logger, config) {
  this.logger = logger;
  this.config = config;
  logger.info("Start zeromq output to " + config.target);

  this.socket = zmq.socket('push');
  this.socket.connect(config.target);

  this.on('data', function(data) {
    this.socket.send(JSON.stringify(data));
  }.bind(this));

  this.emit('ready');
}

OutputZeroMQ.prototype.close = function() {
  this.logger.info("Closing zeromq to " + config.target);
  this.socket.close();
}

module.exports = {
  create: function() {
    return new OutputZeroMQ();
  }
}
