var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node');

function InputStdin() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Stdin',
  }
}

util.inherits(InputStdin, base_input.BaseInput);

InputStdin.prototype.afterLoadConfig = function(callback) {
  process.stdin.resume();
  process.stdin.on('data', function (chunk) {
    this.emit('data', {
      '@source': 'stdin',
      '@message': chunk.toString().trim(),
    });
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