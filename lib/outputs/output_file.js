var events = require('events'),
    util = require('util'),
    fs = require('fs'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer.js'),
    url_parser = require('../lib/url_parser');

function OutputFile() {
  events.EventEmitter.call(this);
}

util.inherits(OutputFile, events.EventEmitter);

OutputFile.prototype.init = function(url) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return this.emit('init_error', 'Unable to parse config : ' + url);
  }

  logger.info('Start writing to file ' + this.config.host);

  this.error_buffer = error_buffer.create('output OutputFile to ' + this.config.host, 2000, this);

  this.stream = fs.createWriteStream(this.config.host, {flags: 'w'});

  this.stream.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));

  this.on('data', function(data) {
    this.stream.write(JSON.stringify(data) + '\n');
  }.bind(this));

  this.emit('init_ok');
}

OutputFile.prototype.close = function() {
  logger.info('Cloing output on file ' + this.config.host);
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
