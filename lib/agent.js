var config_loader = require('config_loader'),
    events = require('events'),
    Log4Node = require('log4node');

var logger = new Log4Node('warning');
var sink = new events.EventEmitter;

var local_modules = {}

function load_module(module_name) {
  if (! local_modules[module_name]) {
    logger.info("Loading module " + module_name);
    local_modules[module_name] = require(module_name);
  }
  return local_modules[module_name];
}

function init_module(module_name, index) {
  var sink = load_module(module_name).create();
  sink.on('ready', function() {
    logger.info("[" + module_name + "][" + index + "] ready");
  })
  sink.on('error', function(err) {
    logger.error("[" + module_name + "][" + index + "] error " + err);
    logger.error(err);
    sink.emit('error', module_name, index, err);
  });
  return sink;
}

function process_data(data) {
  if (!data['@timestamp']) {
    data['@timestamp'] = (new Date()).toString();
  }
  sink.emit('data', data);
}

sink.on('load_config_from_directory', function(directory) {
  logger.info("Start loading config from " + directory);
  config_loader.load(directory, function(err, config) {
    if (err) {
      sink.emit('error', err);
    }
    for(var i in config.input) {
      var index = 0;
      config.input[i].forEach(function(c) {
        var module_sink = init_module("input_" + i, index);
        module_sink.emit('init', logger, c);
        module_sink.on('data', process_data);
        index += 1;
      });
    }

    for(var i in config.output) {
      var index = 0;
      config.output[i].forEach(function(c) {
        var module_sink = init_module("output_" + i, index);
        module_sink.emit('init', logger, c);
        sink.on('data', function(data) {
          module_sink.emit('data', data);
        });
        index += 1;
      });
    }
  });
  return sink;
});

sink.on('set_logger', function(new_logger) {
  logger = new_logger;
});
module.exports = sink;
