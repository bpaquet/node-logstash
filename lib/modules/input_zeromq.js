var events = require('events'),
    util = require('util'),
    zmq = require('zmq'),
    url_parser = require('../lib/url_parser');

function InputZeroMQ() {
  events.EventEmitter.call(this);
}

util.inherits(InputZeroMQ, events.EventEmitter);

InputZeroMQ.prototype.init = function(logger, url, callback) {
  this.logger = logger;
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error("Unable to parse config : " + url));
  }

  this.logger.info("Start zeromq listening to " + this.config.host);

  this.socket = zmq.socket('pull');
  this.socket.bind(this.config.host, function(err) {
    if (err) {
      return this.emit('error', err);
    }
    this.logger.info("Zeromq ready on " + this.config.host);
    callback();
  }.bind(this));

  this.socket.on('message', function(data) {
    this.emit('data', JSON.parse(data));
  }.bind(this));
}

InputZeroMQ.prototype.close = function() {
  this.logger.info("Closing zeromq to " + this.config.host);
  this.socket.close();
}

module.exports = {
  create: function() {
    return new InputZeroMQ();
  }
}
