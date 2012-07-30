var events = require('events'),
    util = require('util'),
    zmq = require('zmq'),
    url_parser = require('../lib/url_parser');

function OutputZeroMQ() {
  events.EventEmitter.call(this);
}

util.inherits(OutputZeroMQ, events.EventEmitter);

OutputZeroMQ.prototype.init = function(logger, url, callback) {
  this.logger = logger;
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error("Unable to parse config : " + url));
  }

  this.logger.info("Start zeromq output to " + this.config.host);

  this.socket = zmq.socket('push');
  this.socket.connect(this.config.host);

  this.on('data', function(data) {
    this.socket.send(JSON.stringify(data));
  }.bind(this));

  process.nextTick(callback);
}

OutputZeroMQ.prototype.close = function() {
  this.logger.info("Closing zeromq to " + this.config.host);
  this.socket.close();
}

module.exports = {
  create: function() {
    return new OutputZeroMQ();
  }
}
