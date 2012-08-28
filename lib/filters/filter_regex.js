var events = require('events'),
    util = require('util'),
    logger = require('log4node'),
    url_parser = require('../lib/url_parser'),
    patterns_loader = require('../lib/patterns_loader'),
    moment = require('moment');

function FilterRegex() {
  events.EventEmitter.call(this);
}

util.inherits(FilterRegex, events.EventEmitter);

FilterRegex.prototype.init = function(url, callback) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return callback(new Error('Unable to parse config : ' + url));
  }

  if (this.config.host) {
    logger.info('Try to load config from pattern file ' + this.config.host);
    patterns_loader.load(this.config.host, function(err, config) {
      if (err) {
        return callback(new Error('Unable to load pattern : ' + this.config.host + ' : ' + err));
      }
      for(var i in config) {
        this.config.params[i] = config[i];
      }
      this.postInit(callback);
    }.bind(this));
  }
  else {
    process.nextTick(function() {
      this.postInit(callback);
    }.bind(this));
  }
}

FilterRegex.prototype.postInit = function(callback) {
  if (!this.config.params.regex) {
    return callback(new Error('Please specify regex in params'));
  }
  this.regex = new RegExp(this.config.params.regex);
  this.date_format = this.config.params.date_format;

  if (!this.config.params.fields) {
    return callback(new Error('Please specify regex in fields'));
  }
  this.fields = this.config.params.fields.split(',');

  logger.info('Initializing regex filter, regex : ' + this.regex + ', fields ' + this.fields + (this.date_format ? ', date format ' + this.date_format : ''));

  this.on('input', function(data) {
    if (!this.config.params.type || this.config.params.type == data['@type']) {
      var result = data['@message'].match(this.regex);
      if (result) {
        if (!data['@fields']) {
          data['@fields'] = {};
        }
        for(var i = 0; i < this.fields.length; i ++) {
          if (result[i + 1]) {
            if (this.date_format && this.fields[i] == 'timestamp') {
              data['@timestamp'] = moment(result[i + 1], this.date_format).format();
            }
            else {
              data['@fields'][this.fields[i]] = result[i + 1];
            }
          }
        }
      }
    }
    this.emit('output', data);
  }.bind(this));

  process.nextTick(callback);
}

module.exports = {
  create: function() {
    return new FilterRegex();
  }
}