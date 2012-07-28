var events = require('events'),
    util = require('util'),
    monitor_file = require('../lib/monitor_file');

function InputFile() {
  events.EventEmitter.call(this);
}

util.inherits(InputFile, events.EventEmitter);

InputFile.prototype.init = function(logger, config) {
  this.logger = logger;
  this.config = config;
  this.logger.info("Start monitoring file " + config.path);
  this.monitor = monitor_file.monitor(config.path, function(err) {
    this.emit('error', err);
  }.bind(this), function(data) {
    this.emit('data', {
      '@message': data,
      '@source': config.path,
      '@type': config.type,
    });
  }.bind(this), {});

  this.monitor.start();

  this.emit('ready');
}

InputFile.prototype.close = function() {
  this.logger.info("Closing monitoring of " + this.config.path);
  this.monitor.close();
}

module.exports = {
  create: function() {
    return new InputFile();
  }
}