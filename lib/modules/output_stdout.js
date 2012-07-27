var events = require('events');

function create() {
  var sink = new events.EventEmitter;

  sink.on('init', function(logger) {
    logger.info("Start output on stdout");
    sink.emit('ready');
  });

  sink.on('data', function(data) {
    process.stdout.write("[STDOUT] " + JSON.stringify(data) + "\n");
  });

  return sink;
}

module.exports = {
  create: create
}
