var url_parser = require('./lib/url_parser'),
    events = require('events'),
    util = require('util'),
    path = require('path'),
    logger = require('log4node');

function LogstashAgent() {
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
  this.modules = [];
  this.first_filter = new events.EventEmitter();
  this.first_filter.setMaxListeners(0);
  this.last_filter_output_func = function(data) {
    this.emit('last_filter', data);
  }.bind(this);
  this.first_filter.on('output', this.last_filter_output_func);
  this.on('first_filter', function(data) {
    this.first_filter.emit('output', data);
  }.bind(this));
  this.last_filter = this.first_filter;
}

util.inherits(LogstashAgent, events.EventEmitter);

LogstashAgent.prototype.close = function(callback) {
  if (this.modules.length === 0) {
    logger.info('Closing agent');
    return callback();
  }
  var module = this.modules.shift();
  logger.debug('Closing module', module.config.name);
  module.close(function() {
    this.close(callback);
  }.bind(this));
};

LogstashAgent.prototype.configure = function(url, type, callback) {
  var parsed = url_parser.extractProtocol(url);
  if (!parsed) {
    return callback(new Error('Unable to extract plugin name from ' + url));
  }
  try {
    logger.debug('Initializing module', type);
    var directory = type + 's';
    var module_name = type + '_' + parsed.protocol;
    var module = require('.' + path.sep + path.join(directory, module_name)).create();
    var callback_called = false;
    var on_error = function(err) {
      if (! callback_called) {
        callback_called = true;
        callback(err, module);
      }
    };
    module.once('error', on_error);
    module.init(parsed.next, function(err) {
      module.removeListener('error', on_error);
      if (! callback_called) {
        callback_called = true;
        callback(err, module);
      }
      module.on('error', function(err) {
        this.emit('error', module_name, err);
      }.bind(this));
    }.bind(this));
  }
  catch(err) {
    callback(err);
  }
};

LogstashAgent.prototype.loadUrls = function(urls, callback) {
  if (urls.length === 0) {
    return callback();
  }
  var url = urls.shift();
  logger.debug('Processing url', url);
  var parsed = url_parser.extractProtocol(url);
  if (!parsed) {
    return callback(new Error('Unable to extract protocol from ' + url));
  }
  if (parsed.protocol === 'input') {
    this.configure(parsed.next, 'input', function(err, module) {
      if (err) {
        return callback(err);
      }
      module.on('data', function(data) {
        this.emit('first_filter', data);
      }.bind(this));
      this.modules.push(module);
      this.loadUrls(urls, callback);
    }.bind(this));
  }
  else if (parsed.protocol === 'output') {
    this.configure(parsed.next, 'output', function(err, module) {
      if (err) {
        return callback(err);
      }
      this.on('last_filter', function(data) {
        module.emit('data', data);
      });
      this.modules.push(module);
      this.loadUrls(urls, callback);
    }.bind(this));
  }
  else if (parsed.protocol === 'filter') {
    this.configure(parsed.next, 'filter', function(err, module) {
      if (err) {
        return callback(err);
      }
      module.on('output', this.last_filter_output_func);
      this.last_filter.removeListener('output', this.last_filter_output_func);
      this.last_filter.on('output', function (data) {
        module.emit('input', data);
      });
      this.modules.push(module);
      this.last_filter = module;
      this.loadUrls(urls, callback);
    }.bind(this));
  }
  else {
    return callback(new Error('Unknown protocol : ' + parsed.protocol));
  }
};

exports.create = function() {
  return new LogstashAgent();
};
