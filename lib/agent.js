var config_loader = require('./config_loader'),
    events = require('events'),
    util = require('util'),
    Log4Node = require('log4node');

function LogstashAgent() {
  events.EventEmitter.call(this);
  this.logger = new Log4Node('warning');
}

util.inherits(LogstashAgent, events.EventEmitter);

LogstashAgent.prototype.init_module = function(module_name, index) {
  var module = require('./modules/' + module_name).create();
  module.on('ready', function() {
    this.logger.info("[" + module_name + "][" + index + "] ready");
  }.bind(this));
  module.on('error', function(err) {
    this.logger.error("[" + module_name + "][" + index + "] error " + err);
    this.logger.error(err.toString());
    this.emit('error', module_name, index, err);
  }.bind(this));
  this.on('close_modules', function() {
    module.close();
  });
  return module;
}

LogstashAgent.prototype.process_data = function(data) {
  if (!data['@timestamp']) {
    data['@timestamp'] = (new Date()).toString();
  }
  this.emit('data', data);
}

LogstashAgent.prototype.process_load_config = function(err, config) {
  if (err) {
    return this.emit('error', 'config_loader', 0, err);
  }

  this.logger.info("Starting modules");

  try {
    for(var i in config.input) {
      var index = 0;
      config.input[i].forEach(function(c) {
        var module = this.init_module("input_" + i, index);
        module.init(this.logger, c);
        module.on('data', function(data) {
          this.process_data(data);
        }.bind(this));
        index += 1;
      }.bind(this));
    }

    for(var i in config.output) {
      var index = 0;
      config.output[i].forEach(function(c) {
        var module = this.init_module("output_" + i, index);
        module.init(this.logger, c);
        this.on('data', function(data) {
          module.emit('data', data);
        });
        index += 1;
      }.bind(this));
    }
    this.logger.info("Config loaded");
    this.emit('config_loaded');
  }
  catch(err) {
    this.emit('error', 'loading_modules', 0, err);
  }

}

LogstashAgent.prototype.load_config_from_directory = function(directory) {
  this.logger.info("Start loading config from directory " + directory);
  config_loader.load_directory(directory, this.process_load_config.bind(this));
}

LogstashAgent.prototype.load_config_from_file = function(file) {
  this.logger.info("Start loading config from file " + file);
  config_loader.load_file(file, this.process_load_config.bind(this));
}

LogstashAgent.prototype.set_logger = function(new_logger) {
  this.logger = new_logger;
}

LogstashAgent.prototype.close = function() {
  this.emit('close_modules');
}

module.exports = {
  create: function() {
    return new LogstashAgent();
  }
}
