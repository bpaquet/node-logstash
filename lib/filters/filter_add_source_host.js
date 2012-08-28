var events = require('events'),
    os = require('os'),
    util = require('util'),
    logger = require('log4node');

function FilterAddSourceHost() {
  events.EventEmitter.call(this);
}

util.inherits(FilterAddSourceHost, events.EventEmitter);

FilterAddSourceHost.prototype.init = function(url, callback) {
  logger.info('Initializing add source host filter');

  this.os = os.hostname();

  this.on('input', function(data) {
    if (!data['@source_host']) {
      data['@source_host'] = this.os;
    }
    this.emit('output', data);
  }.bind(this));

  process.nextTick(callback);
}

module.exports = {
  create: function() {
    return new FilterAddSourceHost();
  }
}
