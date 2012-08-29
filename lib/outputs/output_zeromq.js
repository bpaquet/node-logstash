var events = require('events'),
    util = require('util'),
    zmq = require('zmq'),
    logger = require('log4node'),
    url_parser = require('../lib/url_parser');

function OutputZeroMQ() {
  events.EventEmitter.call(this);
}

util.inherits(OutputZeroMQ, events.EventEmitter);

OutputZeroMQ.prototype.init = function(url) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return this.emit('init_error', 'Unable to parse config : ' + url);
  }

  logger.info('Start zeromq output to ' + this.config.host);

  this.socket = zmq.socket('push');
  this.socket.connect(this.config.host);

  this.on('data', function(data) {
    this.socket.send(JSON.stringify(data));
  }.bind(this));

  this.emit('init_ok');
}

OutputZeroMQ.prototype.close = function() {
  logger.info('Closing zeromq to ' + this.config.host);
  this.socket.close();
}

module.exports = {
  create: function() {
    return new OutputZeroMQ();
  }
}
