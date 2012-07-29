var events = require('events'),
    util = require('util'),
    net = require('net');

function OutputTCP() {
  events.EventEmitter.call(this);
}

util.inherits(OutputTCP, events.EventEmitter);

OutputTCP.prototype.init = function(logger, config) {
  this.logger = logger;
  this.config = config;
  logger.info("Start tcp output to " + config.host + ":" + config.port);

  this.on('data', function(data) {
    var c = net.createConnection({host: config.host, port: config.port}, function() {
      c.write(JSON.stringify(data));
      c.end();
    });
    c.on('error', function(err) {
      this.emit('error', err);
    });
  }.bind(this));

  this.emit('ready');
}

OutputTCP.prototype.close = function() {
  logger.info("Closing tcp output to " + config.host + ":" + config.port);
}

module.exports = {
  create: function() {
    return new OutputTCP();
  }
}
