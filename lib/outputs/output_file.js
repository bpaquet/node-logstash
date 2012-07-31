var events = require('events'),
    util = require('util'),
    fs = require('fs'),
    url_parser = require('../lib/url_parser');

function OutputFile() {
  events.EventEmitter.call(this);
}

util.inherits(OutputFile, events.EventEmitter);

OutputFile.prototype.init = function(logger, url, callback) {
  this.logger = logger;
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error("Unable to parse config : " + url));
  }

  this.logger.info("Start writing to file " + this.config.host);
  this.stream = fs.createWriteStream(this.config.host, {flags: 'w'});

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

  process.nextTick(callback);
}

OutputFile.prototype.close = function() {
  this.logger.info("Cloing output on file " + this.config.host);
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
