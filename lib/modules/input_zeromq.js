var events = require('events'),
    util = require('util'),
    zmq = require('zmq');

function InputZeroMQ() {
  events.EventEmitter.call(this);
}

util.inherits(InputZeroMQ, events.EventEmitter);

InputZeroMQ.prototype.init = function(logger, config) {
  this.logger = logger;
  this.config = config;
  logger.info("Start zeromq listening to " + config.listen);

  this.socket = zmq.socket('pull');
  this.socket.bind(config.listen, function(err) {
    if (err) {
      return this.emit('error', err);
    }
    logger.info("Zeromq ready on " + config.listen);
    this.emit('ready');
  }.bind(this));

  this.socket.on('message', function(data) {
    this.emit('data', JSON.parse(data));
  }.bind(this));
}

InputZeroMQ.prototype.close = function() {
  this.logger.info("Closing zeromq to " + config.target);
  this.socket.close();
}

module.exports = {
  create: function() {
    return new InputZeroMQ();
  }
}
