var events = require('events'),
    util = require('util'),
    logger = require('log4node'),
    url_parser = require('../lib/url_parser'),
    monitor_file = require('../lib/monitor_file');

function InputFile() {
  events.EventEmitter.call(this);
}

util.inherits(InputFile, events.EventEmitter);

InputFile.prototype.init = function(url) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return this.emit('init_error', 'Unable to parse config : ' + url);
  }

  logger.info('Start monitoring file ' + this.config.host);
  this.monitor = monitor_file.monitor(this.config.host, {});

  this.monitor.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.monitor.on('init_error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.monitor.on('data', function(data) {
    try {
      var parsed = JSON.parse(data);
      if (!parsed['@message']) {
        throw new Error();
      }
      this.emit('data', parsed);
    }
    catch(e) {
      this.emit('data', {
        '@message': data,
        '@source': this.config.host,
        '@type': this.config.params.type,
      });
    }
  }.bind(this));

  this.monitor.start(this.config.params.start_index);

  this.emit('init_ok');
}

InputFile.prototype.close = function() {
  logger.info('Closing monitoring of ' + this.config.host);
  this.monitor.close();
}

module.exports = {
  create: function() {
    return new InputFile();
  }
}