var events = require('events'),
    logger = require('log4node'),
    util = require('util');

function OutputStdout() {
  events.EventEmitter.call(this);
}

util.inherits(OutputStdout, events.EventEmitter);

OutputStdout.prototype.init = function(url, callback) {
  logger.info("Start output on stdout");

  this.on('data', function(data) {
    process.stdout.write("[STDOUT] " + JSON.stringify(data) + "\n");
  });

  process.nextTick(callback);
}

OutputStdout.prototype.close = function() {
  logger.info("Closing stdout");
}

module.exports = {
  create: function() {
    return new OutputStdout();
  }
}
