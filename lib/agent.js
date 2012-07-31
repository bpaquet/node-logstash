var url_parser = require('./lib/url_parser'),
    events = require('events'),
    util = require('util'),
    os = require('os'),
    Log4Node = require('log4node');

function LogstashAgent() {
  events.EventEmitter.call(this);
  this.logger = new Log4Node('warning');
  this.modules = [];
}

util.inherits(LogstashAgent, events.EventEmitter);

LogstashAgent.prototype.process_data = function(data) {
  if (!data['@timestamp']) {
    data['@timestamp'] = (new Date()).toISOString();
  }
  if (!data['@source_host']) {
    data['@source_host'] = os.hostname();
  }
  this.emit('data', data);
}

LogstashAgent.prototype.set_logger = function(new_logger) {
  this.logger = new_logger;
}

LogstashAgent.prototype.close = function() {
  while(this.modules.length > 0) {
    var module = this.modules.shift();
    module.close();
  }
}

LogstashAgent.prototype.init_module = function(module_name) {
  var module = require('./modules/' + module_name).create();
  module.on('ready', function() {
    this.logger.info("[" + module_name + "] ready");
  }.bind(this));
  module.on('error', function(err) {
    this.emit('error', module_name, err);
  }.bind(this));
  this.modules.push(module);
  return module;
}

LogstashAgent.prototype.configure = function(url, prefix, callback) {
  var parsed = url_parser.extractProtocol(url);
  if (!parsed) {
    return callback(new Error("Unable to extract plugin name from " + url));
  }
  try {
    var module = this.init_module(prefix + parsed.protocol);
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
    this.configure(parsed.next, 'input_', function(err, module) {
      if (err) {
        return callback(err);
      }
      module.on('data', function(data) {
        this.process_data(data);
      }.bind(this));
      this.load_urls(urls, callback);
    }.bind(this));
  }
  else if (parsed.protocol == 'output') {
    this.configure(parsed.next, 'output_', function(err, module) {
      if (err) {
        return callback(err);
      }
      this.on('data', function(data) {
        module.emit('data', data);
      })
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
