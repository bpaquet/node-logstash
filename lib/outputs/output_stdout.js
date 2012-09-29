var base_output = require('../lib/base_output'),
    logger = require('log4node'),
    util = require('util');

function OutputStdout() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Stdout',
  }
}

util.inherits(OutputStdout, base_output.BaseOutput);

OutputStdout.prototype.afterLoadConfig = function(callback) {
  logger.info("Start output on stdout");
  callback();
}

OutputStdout.prototype.process = function(data) {
  process.stdout.write("[STDOUT] " + JSON.stringify(data) + "\n");
}

OutputStdout.prototype.close = function(callback) {
  logger.info("Closing stdout");
  callback();
}

exports.create = function() {
  return new OutputStdout();
}
