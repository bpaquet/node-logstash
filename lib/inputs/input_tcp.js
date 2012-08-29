var events = require('events'),
    net = require('net'),
    util = require('util'),
    logger = require('log4node'),
    url_parser = require('../lib/url_parser');

function InputTcp() {
  events.EventEmitter.call(this);
}

util.inherits(InputTcp, events.EventEmitter);

InputTcp.prototype.init = function(url, callback) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error('Unable to parse config : ' + url));
  }

  this.host = url_parser.extractPortNumber(this.config.host);

  if (!this.host) {
    return callback(new Error('Unable to parse host : ' + this.config.host));
  }

  logger.info('Start listening on tcp port ' + this.host.port);

  this.server = net.createServer(function(c) {
    c.on('data', function(data) {
      try {
      var parsed = JSON.parse(data);
      this.emit('data', parsed);
      }
      catch(e) {
        this.emit('data', {
          '@message': data.toString().trim(),
          '@source': 'tcp_port_' + this.host.port,
          '@type': this.config.params.type,
        });
      }
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this));

  this.server.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.server.listen(this.host.port);

  process.nextTick(callback);
}

InputTcp.prototype.close = function() {
  logger.info('Closing socket listening on tcp port ' + this.host.port);
  this.server.close();
}

module.exports = {
  create: function() {
    return new InputTcp();
  }
}