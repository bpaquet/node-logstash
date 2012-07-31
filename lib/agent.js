var url_parser = require('./lib/url_parser'),
    events = require('events'),
    util = require('util'),
    path = require('path'),
    Log4Node = require('log4node');

function LogstashAgent() {
  events.EventEmitter.call(this);
  this.logger = new Log4Node('warning');
  this.modules = [];
  this.first_filter = new events.EventEmitter;
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

LogstashAgent.prototype.set_logger = function(new_logger) {
  this.logger = new_logger;
}

LogstashAgent.prototype.close = function() {
  while(this.modules.length > 0) {
    var module = this.modules.shift();
    module.close();
  }
}

LogstashAgent.prototype.init_module = function(directory, module_name) {
  var module = require('.' + path.sep + path.join(directory, module_name)).create();
  module.on('ready', function() {
    this.logger.info("[" + module_name + "] ready");
  }.bind(this));
  module.on('error', function(err) {
    this.emit('error', module_name, err);
  }.bind(this));
  return module;
}

LogstashAgent.prototype.configure = function(url, type, callback) {
  var parsed = url_parser.extractProtocol(url);
  if (!parsed) {
    return callback(new Error("Unable to extract plugin name from " + url));
  }
  try {
    var module = this.init_module(type + 's', type + '_' + parsed.protocol);
    module.init(this.logger, parsed.next, function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, module);
    }.bind(this));
  }
  catch(err) {
    callback(new Error("Error while initializing module " + parsed.protocol + ' : ' + err));
  }
}

LogstashAgent.prototype.load_urls = function(urls, callback) {
  if (urls.length == 0) {
    return callback();
  }
  var url = urls.shift();
  var parsed = url_parser.extractProtocol(url);
  if (!parsed) {
    return callback(new Error("Unable to extract protocol from " + url));
  }
  if (parsed.protocol == 'input') {
    this.configure(parsed.next, 'input', function(err, module) {
      if (err) {
        return callback(err);
      }
      module.on('data', function(data) {
        this.emit('first_filter', data);
      }.bind(this));
      this.modules.push(module);
      this.load_urls(urls, callback);
    }.bind(this));
  }
  else if (parsed.protocol == 'output') {
    this.configure(parsed.next, 'output', function(err, module) {
      if (err) {
        return callback(err);
      }
      this.on('last_filter', function(data) {
        module.emit('data', data);
      })
      this.modules.push(module);
      this.load_urls(urls, callback);
    }.bind(this));
  }
  else if (parsed.protocol == 'filter') {
    this.configure(parsed.next, 'filter', function(err, module) {
      if (err) {
        return callback(err);
      }
      module.on('output', this.last_filter_output_func);
      this.last_filter.removeListener('output', this.last_filter_output_func);
      this.last_filter.on('output', function (data) {
        module.emit('input', data);
      });
      this.last_filter = module;
      this.load_urls(urls, callback);
    }.bind(this));
  }
  else {
    return callback(new Error("Unknown protocol : " + parsed.protocol));
  }
}

module.exports = {
  create: function() {
    return new LogstashAgent();
  }
}
