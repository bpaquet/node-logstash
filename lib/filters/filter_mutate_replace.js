var events = require('events'),
    util = require('util'),
    url_parser = require('../lib/url_parser'),
    logger = require('log4node');

function FilterMutateReplace() {
  events.EventEmitter.call(this);
}

util.inherits(FilterMutateReplace, events.EventEmitter);

FilterMutateReplace.prototype.init = function(url) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return this.emit('init_error', 'Unable to parse config : ' + url);
  }

  if (!this.config.host) {
    return this.emit('init_error', 'Please specify field in url');
  }

  if (!this.config.params.to) {
    return this.emit('init_error', 'Please specify to in params');
  }

  if (!this.config.params.from) {
    return this.emit('init_error', 'Please specify from in params');
  }

  if (!this.config.params.to) {
    return this.emit('init_error', 'Please specify to in params');
  }

  this.regex = new RegExp(this.config.params.from, 'g');

  logger.info('Initializing mutate gsub filter on field: ' + this.config.host + ', from: ' + this.config.params.from + ', to:' + this.config.params.to);

  this.on('input', function(data) {
    if (!this.config.params.type || this.config.params.type == data['@type']) {
      if (data['@fields'] && data['@fields'][this.config.host]) {
        logger.debug('Gsub on field', this.config.host, ', from', this.config.params.from, ', to', this.config.params.to, ', current value', data['@fields'][this.config.params.field]);
        data['@fields'][this.config.host] = data['@fields'][this.config.host].replace(this.regex, this.config.params.to);
        logger.debug('New value', data['@fields'][this.config.host]);
      }
    }
    this.emit('output', data);
  }.bind(this));

  this.emit('init_ok');
}

module.exports = {
  create: function() {
    return new FilterMutateReplace();
  }
}