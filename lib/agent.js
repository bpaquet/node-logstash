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
  this.close_inputs(function() {
    this.close_filters(function() {
      this.close_outputs(function() {
        logger.info('Closing agent');
        return callback();
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

LogstashAgent.prototype.close_modules = function(l, callback) {
  if (l.length === 0) {
    return callback();
  }
  var m = l.shift();
  if (m.module) {
    m.module.close(function() {
      delete m.module;
      this.close_modules(l, callback);
    }.bind(this));
  }
  else {
    this.close_modules(l, callback);
  }
};

LogstashAgent.prototype.close_inputs = function(callback) {
  this.close_modules(this.modules.inputs.slice(0), callback);
};

LogstashAgent.prototype.close_filters = function(callback) {
  this.close_modules(this.modules.filters.slice(0), callback);
};

LogstashAgent.prototype.close_outputs = function(callback) {
  this.close_modules(this.modules.outputs.slice(0), callback);
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
  this.modules = {
    inputs: [],
    filters: [],
    outputs: [],
  };
  urls.forEach(function(url) {
    var parsed = url_parser.extractProtocol(url);
    if (!parsed) {
      return callback(new Error('Unable to extract protocol from ' + url));
    }
    if (parsed.protocol === 'input') {
      this.modules.inputs.push({url: parsed.next});
    }
    else if (parsed.protocol === 'output') {
      this.modules.outputs.push({url: parsed.next});
    }
    else if (parsed.protocol === 'filter') {
      this.modules.filters.push({url: parsed.next});
    }
    else {
      return callback(new Error('Unknown protocol : ' + parsed.protocol));
    }
  }.bind(this));
  this.start_outputs(function(err) {
    if (err) {
      return callback(err);
    }
    this.start_filters(function(err) {
      if (err) {
        return callback(err);
      }
      this.start_inputs(callback);
    }.bind(this));
  }.bind(this));
};

LogstashAgent.prototype.start_modules = function(l, callback, type, module_callback) {
  if (l.length === 0) {
    return callback();
  }
  var m = l.shift();
  this.configure(m.url, type, function(err, module) {
    if (err) {
      return callback(err);
    }
    m.module = module;

    module_callback(module, function(err) {
      if (err) {
        return callback(err);
      }
      this.start_modules(l, callback, type, module_callback);
    }.bind(this));

  }.bind(this));
};

LogstashAgent.prototype.start_inputs = function(callback) {
  this.start_modules(this.modules.inputs.slice(0), callback, 'input', function(module, module_callback) {

    module.on('data', function(data) {
      this.emit('first_filter', data);
    }.bind(this));

    module_callback();
  }.bind(this));
};

LogstashAgent.prototype.start_filters = function(callback) {
  this.start_modules(this.modules.filters.slice(0), callback, 'filter', function(module, module_callback) {

    module.on('output', this.last_filter_output_func);
    this.last_filter.removeListener('output', this.last_filter_output_func);
    this.last_filter.on('output', function (data) {
      module.emit('input', data);
    });

    this.last_filter = module;

    module_callback();
  }.bind(this));
};

LogstashAgent.prototype.start_outputs = function(callback) {
  this.start_modules(this.modules.outputs.slice(0), callback, 'output', function(module, module_callback) {

    this.on('last_filter', function(data) {
      module.emit('data', data);
    });

    module_callback();
  }.bind(this));
};

exports.create = function() {
  return new LogstashAgent();
};
