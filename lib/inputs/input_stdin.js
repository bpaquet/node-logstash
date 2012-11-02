var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    os = require('os');

function InputStdin() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Stdin',
    optional_params: ['type', 'format', 'tags'],
  }
  this.host = os.hostname();
}

util.inherits(InputStdin, base_input.BaseInput);

InputStdin.prototype.afterLoadConfig = function(callback) {
  process.stdin.resume();
  process.stdin.on('data', function (chunk) {
    this.emit('data', this.toEvent(chunk.toString().trim(), 'stdin://'+this.host+'/'));
  }.bind(this));

  callback();
}

InputStdin.prototype.close = function(callback) {
  logger.info('Closing stdin');
  callback();
}

exports.create = function() {
  return new InputStdin();
}