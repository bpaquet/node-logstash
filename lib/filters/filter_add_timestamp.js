var events = require('events'),
    util = require('util'),
    logger = require('log4node');

function FilterAddTimestamp() {
  events.EventEmitter.call(this);
}

util.inherits(FilterAddTimestamp, events.EventEmitter);

FilterAddTimestamp.prototype.init = function(url, callback) {
  logger.info('Initializing add timestamp filter');

  this.on('input', function(data) {
    if (!data['@timestamp']) {
      data['@timestamp'] = (new Date()).toISOString();
    }
    this.emit('output', data);
  }.bind(this));

  process.nextTick(callback);
}

module.exports = {
  create: function() {
    return new FilterAddTimestamp();
  }
}