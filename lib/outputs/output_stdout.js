var base_output = require('../lib/base_output'),
  logger = require('log4node'),
  util = require('util');

function OutputStdout() {
  base_output.BaseOutput.call(this);
  this.mergeConfig({
    name: 'Stdout',
  });
}

util.inherits(OutputStdout, base_output.BaseOutput);

OutputStdout.prototype.process = function(data) {
  process.stdout.write('[STDOUT] ' + JSON.stringify(data, null, 2) + '\n');
};

OutputStdout.prototype.close = function(callback) {
  logger.info('Closing stdout');
  callback();
};

exports.create = function() {
  return new OutputStdout();
};
