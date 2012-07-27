var fs = require('fs'),
    events = require('events');

function create() {
  var sink = new events.EventEmitter;

  sink.on('init', function(logger, config) {
    logger.info("Start writing to file " + config.path);
    var stream = fs.createWriteStream(config.path, { flags: 'w'});

    stream.on('error', function(err) {
      sink.emit('error', err);
    });

    sink.on('data', function(data) {
      stream.write(JSON.stringify(data) + "\n", function(err) {
        if (err) {
          external_sink.emit('error', err);
        }
      });
    });

    sink.on('close', function() {
      stream.end(function(err) {
        if (err) {
          external_sink.emit('error', err);
        }
      });
    });

    sink.emit('ready');
  });
  return sink;
}

module.exports = {
  create: create
}
