var events = require('events'),
    util = require('util'),
    url_parser = require('../lib/url_parser'),
    monitor_file = require('../lib/monitor_file');

function InputFile() {
  events.EventEmitter.call(this);
}

util.inherits(InputFile, events.EventEmitter);

InputFile.prototype.init = function(logger, url, callback) {
  this.logger = logger;
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error("Unable to parse config : " + url));
  }

  this.logger.info("Start monitoring file " + this.config.host);
  this.monitor = monitor_file.monitor(this.config.host, function(err) {
    this.emit('error', err);
  }.bind(this), function(data) {
    try {
      var parsed = JSON.parse(data);
      this.emit('data', parsed);
    }
    catch(e) {
      this.emit('data', {
        '@message': data,
        '@source': this.config.host,
        '@type': this.config.params.type,
      });
    }
  }.bind(this), {});

  this.monitor.start(this.config.params.start_index);

  process.nextTick(callback);
}

InputFile.prototype.close = function() {
  this.logger.info("Closing monitoring of " + this.config.host);
  this.monitor.close();
}

module.exports = {
  create: function() {
    return new InputFile();
  }
}