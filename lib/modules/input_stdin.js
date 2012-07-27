var events = require('events');

function create() {
  var sink = new events.EventEmitter;

  sink.on('init', function(logger) {
    logger.info("Start monitoring stdin");
    process.stdin.resume();
    process.stdin.on('data', function (chunk) {
      sink.emit('data', {
        '@source': 'stdin',
        '@message': chunk.toString().trim(),
      });
    });
    sink.emit('ready');
  });

  return sink;
}

module.exports = {
  create: create
}