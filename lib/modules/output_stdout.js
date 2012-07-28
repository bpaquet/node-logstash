var events = require('events'),
    util = require('util'),
    monitor_file = require('../lib/monitor_file');

function OutputStdout() {
  events.EventEmitter.call(this);
}

util.inherits(OutputStdout, events.EventEmitter);

OutputStdout.prototype.init = function(logger, config) {
  this.logger = logger;
  logger.info("Start output on stdout");

  this.on('data', function(data) {
    process.stdout.write("[STDOUT] " + JSON.stringify(data) + "\n");
  });

  this.emit('ready');
}

OutputStdout.prototype.close = function() {
  this.logger.info("Closing stdout");
}

module.exports = {
  create: function() {
    return new OutputStdout();
  }
}
