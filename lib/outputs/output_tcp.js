var events = require('events'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    url_parser = require('../lib/url_parser');

function OutputTCP() {
  events.EventEmitter.call(this);
}

util.inherits(OutputTCP, events.EventEmitter);

OutputTCP.prototype.init = function(url, callback) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error('Unable to parse config : ' + url));
  }

  this.host = url_parser.extractPortNumber(this.config.host);

  if (!this.host) {
    return callback(new Error('Unable to parse host : ' + this.config.host));
  }

  logger.info('Start tcp output to ' + this.host.host + ':' + this.host.port);

  this.on('data', function(data) {
    var c = net.createConnection({host: this.host.host, port: this.host.port}, function() {
      c.write(JSON.stringify(data));
      c.end();
    });
    c.on('error', function(err) {
      this.emit('error', err);
    });
  }.bind(this));

  process.nextTick(callback);
}

OutputTCP.prototype.close = function() {
  logger.info('Closing tcp output to ' + this.host.host + ':' + this.host.port);
}

module.exports = {
  create: function() {
    return new OutputTCP();
  }
}
