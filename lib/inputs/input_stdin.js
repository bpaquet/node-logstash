var events = require('events'),
    util = require('util'),
    logger = require('log4node');

function InputStdin() {
  events.EventEmitter.call(this);
}

util.inherits(InputStdin, events.EventEmitter);

InputStdin.prototype.init = function(url, callback) {
  logger.info('Start monitoring stdin');
  process.stdin.resume();
  process.stdin.on('data', function (chunk) {
    this.emit('data', {
      '@source': 'stdin',
      '@message': chunk.toString().trim(),
    });
  }.bind(this));
  process.nextTick(callback);
}

InputStdin.prototype.close = function() {
  logger.info('Closing stdin');
}

module.exports = {
  create: function() {
    return new InputStdin();
  }
}