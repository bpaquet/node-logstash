var events = require('events'),
    monitor_file = require('monitor_file');

function create() {
  var sink = new events.EventEmitter;

  sink.on('init', function(logger, config) {
    logger.info("Start monitoring file " + config.path);
    var monitor = monitor_file.monitor(config.path, function(err) {
      sink.emit('error', err);
    }, function(data) {
      sink.emit('data', {
        '@message': data,
        '@source': config.path,
        '@type': config.type,
      });
    }, {});

    sink.on('close', function() {
      monitor.close();
    });

    monitor.start();

    sink.emit('ready');
  });


  return sink;
}

module.exports = {
  create: create
}