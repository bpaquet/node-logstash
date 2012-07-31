var events = require('events'),
    util = require('util');

function OutputStdout() {
  events.EventEmitter.call(this);
}

util.inherits(OutputStdout, events.EventEmitter);

OutputStdout.prototype.init = function(logger, url, callback) {
  this.logger = logger;
  this.logger.info("Start output on stdout");

  this.on('data', function(data) {
    process.stdout.write("[STDOUT] " + JSON.stringify(data) + "\n");
  });

  process.nextTick(callback);
}

OutputStdout.prototype.close = function() {
  this.logger.info("Closing stdout");
}

module.exports = {
  create: function() {
    return new OutputStdout();
  }
}
