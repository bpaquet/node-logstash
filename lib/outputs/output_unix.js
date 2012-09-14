var events = require('events'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer.js'),
    url_parser = require('../lib/url_parser');

function OutputUnix() {
  events.EventEmitter.call(this);
}

util.inherits(OutputUnix, events.EventEmitter);

OutputUnix.prototype.init = function(url) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return this.emit('init_error', 'Unable to parse config : ' + url);
  }

  logger.info('Start unix socket output to ' + this.config.host);

  this.error_buffer = error_buffer.create('output unix to ' + this.config.host, 2000, this);

  this.on('data', function(data) {
    var c = net.createConnection({path: this.config.host}, function() {
      c.write(JSON.stringify(data));
      c.end();
    });
    c.on('error', function(err) {
      this.error_buffer.emit('error', err);
    });
  }.bind(this));

  this.emit('init_ok');
}

OutputUnix.prototype.close = function() {
  logger.info('Closing unix socket output to ' + this.config.host);
}

module.exports = {
  create: function() {
    return new OutputUnix();
  }
}
