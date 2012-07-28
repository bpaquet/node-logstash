var events = require('events'),
    util = require('util'),
    fs = require('fs'),
    monitor_file = require('../lib/monitor_file');

function OutputFile() {
  events.EventEmitter.call(this);
}

util.inherits(OutputFile, events.EventEmitter);

OutputFile.prototype.init = function(logger, config) {
  this.logger = logger;
  this.config = config;

  this.logger.info("Start writing to file " + this.config.path);
  this.stream = fs.createWriteStream(config.path, {flags: 'w'});

  this.stream.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.on('data', function(data) {
    this.stream.write(JSON.stringify(data) + "\n", function(err) {
      if (err) {
        this.emit('error', err);
      }
    }.bind(this));
  }.bind(this));

  this.emit('ready');
}

OutputFile.prototype.close = function() {
  this.stream.end(function(err) {
    if (err) {
      this.emit('error', err);
    }
  }.bind(this));
}

module.exports = {
  create: function() {
    return new OutputFile();
  }
}
