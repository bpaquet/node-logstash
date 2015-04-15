var url_parser = require('./lib/url_parser'),
  sig_listener = require('./lib/sig_listener').sig_listener,
  events = require('events'),
  util = require('util'),
  path = require('path'),
  async = require('./lib/async'),
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
  this.sig_listener = function() {
    if (this.closed_inputs) {
      logger.info('Starting inputs plugins');
      this.start_inputs();
    }
    else {
      logger.info('Closing inputs plugins');
      this.close_inputs();
    }
  }.bind(this);
  sig_listener.on('SIGUSR1', this.sig_listener);
  this.alarm_count = 0;
  this.on('alarm', function(mode, module) {
    if (mode) {
      this.alarm_count += 1;
      logger.warning('Alarm on for module', module, 'number of alarms', this.alarm_count);
      if (this.closed_inputs === false) {
        logger.warning('Alarm, closing inputs plugins');
        this.close_inputs();
        this.emit('alarm_mode', true);
      }
    }
    if (!mode) {
      this.alarm_count -= 1;
      logger.warning('Alarm off for module', module, 'number of alarms', this.alarm_count);
      if (this.alarm_count === 0 && this.closed_inputs === true) {
        logger.warning('Alarm off, starting inputs plugins');
        this.start_inputs();
        this.emit('alarm_mode', false);
      }
    }
  });
}

util.inherits(LogstashAgent, events.EventEmitter);

LogstashAgent.prototype.close = function(callback) {
  this.close_inputs(function() {
    this.close_filters(function() {
      this.close_outputs(function() {
        logger.info('Closing agent');
        if (this.sig_listener) {
          sig_listener.removeListener('SIGUSR1', this.sig_listener);
        }
        return callback();
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

LogstashAgent.prototype.close_modules = function(l, callback) {
  async.eachSeries(l, function(m, callback) {
    if (m.module) {
      m.module.close(function() {
        delete m.module;
        callback();
      }.bind(this));
    }
    else {
      callback();
    }
  }.bind(this), callback);
};

LogstashAgent.prototype.close_inputs = function(callback) {
  if (!callback) {
    callback = function(err) {
      if (err) {
        logger.error('Unable to close plugins', err);
      }
      else {
        logger.info('All plugins closed');
      }
    };
  }
  this.close_modules(this.modules.inputs, function(err) {
    if (err) {
      return callback(err);
    }
    this.closed_inputs = true;
    callback();
  }.bind(this));
};

LogstashAgent.prototype.close_filters = function(callback) {
  this.close_modules(this.modules.filters, callback);
};

LogstashAgent.prototype.close_outputs = function(callback) {
  this.close_modules(this.modules.outputs, callback);
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
    var module = require('./' + path.join(directory, module_name)).create();
    var callback_called = false;
    var on_error = function(err) {
      if (!callback_called) {
        callback_called = true;
        callback(err, module);
      }
    };
    module.once('error', on_error);
    module.init(parsed.next, function(err) {
      module.removeListener('error', on_error);
      if (!callback_called) {
        callback_called = true;
        callback(err, module);
      }
      module.on('error', function(err) {
        this.emit('error', module_name, err);
      }.bind(this));
    }.bind(this));
  }
  catch (err) {
    callback(err);
  }
};

LogstashAgent.prototype.start = function(urls, callback) {
  this.modules = {
    inputs: [],
    filters: [],
    outputs: [],
  };
  for (var k in urls) {
    var url = urls[k];
    var parsed = url_parser.extractProtocol(url);
    if (!parsed) {
      return callback(new Error('Unable to extract protocol from ' + url));
    }
    if (parsed.protocol === 'input') {
      this.modules.inputs.push({
        url: parsed.next
      });
    }
    else if (parsed.protocol === 'output') {
      this.modules.outputs.push({
        url: parsed.next
      });
    }
    else if (parsed.protocol === 'filter') {
      this.modules.filters.push({
        url: parsed.next
      });
    }
    else {
      return callback(new Error('Unknown protocol : ' + parsed.protocol));
    }
  }
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
  async.eachSeries(l, function(m, callback) {
    this.configure(m.url, type, function(err, module) {
      if (err) {
        return callback(err);
      }
      m.module = module;
      module_callback(module, callback);
    }.bind(this));
  }.bind(this), callback);
};

LogstashAgent.prototype.start_inputs = function(callback) {
  if (!callback) {
    callback = function(err) {
      if (err) {
        logger.error('Unable to start plugins', err);
      }
      else {
        logger.info('All plugins started');
      }
    };
  }
  this.start_modules(this.modules.inputs, function(err) {
    if (err) {
      return callback(err);
    }
    this.closed_inputs = false;
    callback();
  }.bind(this), 'input', function(module, module_callback) {

    module.on('data', function(data) {
      this.emit('first_filter', data);
    }.bind(this));

    module_callback();
  }.bind(this));
};

LogstashAgent.prototype.start_filters = function(callback) {
  this.start_modules(this.modules.filters, callback, 'filter', function(module, module_callback) {

    module.on('output', this.last_filter_output_func);
    this.last_filter.removeListener('output', this.last_filter_output_func);
    this.last_filter.on('output', function(data) {
      module.emit('input', data);
    });

    this.last_filter = module;

    module_callback();
  }.bind(this));
};

LogstashAgent.prototype.start_outputs = function(callback) {
  this.start_modules(this.modules.outputs, callback, 'output', function(module, module_callback) {

    this.on('last_filter', function(data) {
      module.emit('data', data);
    });

    module.on('alarm', function(mode, name) {
      this.emit('alarm', mode, name);
    }.bind(this));

    module_callback();
  }.bind(this));
};

exports.create = function() {
  return new LogstashAgent();
};
