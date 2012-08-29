var events = require('events'),
    net = require('net'),
    util = require('util'),
    logger = require('log4node'),
    url_parser = require('../lib/url_parser');

function InputUnix() {
  events.EventEmitter.call(this);
}

util.inherits(InputUnix, events.EventEmitter);

InputUnix.prototype.init = function(url, callback) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error('Unable to parse config : ' + url));
  }

  logger.info('Start listening on unix socket ' + this.config.host);

  this.server = net.createServer(function(c) {
    c.on('data', function(data) {
      try {
      var parsed = JSON.parse(data);
      this.emit('data', parsed);
    }
    catch(e) {
      this.emit('data', {
        '@message': data.toString().trim(),
        '@source': 'unix' + this.config.host,
        '@type': this.config.params.type,
      });
    }
  }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }.bind(this)).listen(this.config.host);

  process.nextTick(callback);
}

InputUnix.prototype.close = function() {
  logger.info('Closing socket listening on tcp port ' + this.config.host);
  this.server.close();
}

module.exports = {
  create: function() {
    return new InputUnix();
  }
}