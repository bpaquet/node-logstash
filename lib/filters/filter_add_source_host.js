var events = require('events'),
    os = require('os'),
    util = require('util');

function FilterAddSourceHost() {
  events.EventEmitter.call(this);
}

util.inherits(FilterAddSourceHost, events.EventEmitter);

FilterAddSourceHost.prototype.init = function(logger, url, callback) {
  this.logger = logger;

  this.logger.info("Initializing add source host filter");

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
