var events = require('events'),
    net = require('net'),
    util = require('util');

function InputTcp() {
  events.EventEmitter.call(this);
}

util.inherits(InputTcp, events.EventEmitter);

InputTcp.prototype.init = function(logger, config) {
  this.logger = logger;
  this.config = config;
  this.logger.info("Start listening on tcp port " + config.port);

  this.server = net.createServer(function(c) {
    c.on('data', function(data) {
      this.emit('data', {
        '@source': 'tcp_port_' + config.port,
        '@type': config.type,
        '@message': data.toString().trim(),
      });
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this)).listen(config.port);
  this.emit('ready');
}

InputTcp.prototype.close = function() {
  this.logger.info("Closing socket listening on tcp port " + this.config.port);
  this.server.close();
}

module.exports = {
  create: function() {
    return new InputTcp();
  }
}