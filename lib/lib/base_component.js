var events = require('events'),
    util = require('util'),
    ssl_helper = require('ssl_helper'),
    url_parser = require('../lib/url_parser'),
    logger = require('log4node');

function BaseComponent() {
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
  this.required_libs = {};
  this.config = {
    optional_params: [],
    required_params: [],
    default_values: {},
  };
}

util.inherits(BaseComponent, events.EventEmitter);

BaseComponent.prototype.extendedLoadConfig = function(callback) {
  callback();
}

BaseComponent.prototype.requireLib = function(name) {
  if (!this.required_libs[name]) {
    try {
    this.required_libs[name] = require(name);
    }
    catch(e) {
      console.error('Unable to load module', name);
      throw e;
    }
  }
  return this.required_libs[name];
}

BaseComponent.prototype.merge_config = function(config) {
  ['name', 'host_field', 'port_field', 'allow_empty_host'].forEach(function(x) {
    if (config[x]) {
      this.config[x] = config[x];
    }
  }.bind(this));
  ['required_params', 'optional_params'].forEach(function(x) {
    if (config[x]) {
      this.config[x] = this.config[x].concat(config[x]);
    }
  }.bind(this));
  if (config.default_values) {
    for(var x in config.default_values) {
      this.config.default_values[x] = config.default_values[x];
    }
  }
}

BaseComponent.prototype.processValue = function(x) {
  if (x === 'true') {
    return true;
  }
  else if (x === 'false') {
    return false;
  }
  return x;
}

BaseComponent.prototype.loadConfig = function(url, callback) {
  this.message_filtering = {};

  if (this.config.host_field || this.config.port_field || this.config.required_params.length > 0 || this.config.optional_params.length > 0) {
    if (url.length == 0) {
      return this.emit('init_error', 'No empty url for ' + this.config.name);
    }

    this.parsed_url = url_parser.processUrlContent(url);

    if (!this.parsed_url) {
      return this.emit('init_error', 'Unable to parse config : ' + url);
    }

    if (this.config.host_field) {
      if (!this.parsed_url.host && !this.config.allow_empty_host) {
        return this.emit('init_error', 'No host found in url ' + url);
      }

      if (this.config.port_field) {
        var p = url_parser.extractPortNumber(this.parsed_url.host);
        if (!p) {
          return this.emit('init_error', 'Unable to extract port from ' + this.parsed_url.host);
        }
        this[this.config.host_field] = p.host;
        this[this.config.port_field] = p.port;
      }
      else {
        this[this.config.host_field] = this.parsed_url.host;
      }
    }

    if (this.config.required_params) {
      for(var i = 0; i < this.config.required_params.length; i ++) {
        var val = this.parsed_url.params[this.config.required_params[i]];
        if (val) {
          this[this.config.required_params[i]] = this.processValue(val);
        }
      }
    }

    if (this.config.optional_params) {
      for(var i = 0; i < this.config.optional_params.length; i ++) {
        var val = this.parsed_url.params[this.config.optional_params[i]];
        if (val) {
          this[this.config.optional_params[i]] = this.processValue(val);
        }
      }
    }

    if (this.config.default_values) {
      for(var i in this.config.default_values) {
        if (this[i] === undefined) {
          this[i] = this.config.default_values[i];
        }
      }
    }

    if (this.parsed_url.params.only_type) {
      this.message_filtering.only_type = this.parsed_url.params.only_type;
    }

    for(var i in this.parsed_url.params) {
      var res = i.match(/^only_field_exist_(.+)$/);
      if (res) {
        if (!this.message_filtering.only_field_exist) {
          this.message_filtering.only_field_exist = [];
        }
        this.message_filtering.only_field_exist.push(res[1]);
      }
      var res = i.match(/^only_field_equal_(.+)$/);
      if (res) {
        if (!this.message_filtering.only_field_equal) {
          this.message_filtering.only_field_equal = {};
        }
        this.message_filtering.only_field_equal[res[1]] = this.parsed_url.params[i];
      }
    }

    this.extendedLoadConfig(function(err) {
      if (err) {
        return callback(err);
      }

      if (this.config.required_params) {
        for(var i = 0; i < this.config.required_params.length; i ++) {
          if (!this[this.config.required_params[i]]) {
            return this.emit('init_error', 'You have to specify ' + this.config.required_params[i] + ' in url ' + url);
          }
        }
      }

      if (this.ssl) {
        ssl_helper.load_ssl_files(this, function() {
          this.afterLoadConfig(callback);
        }.bind(this));
      }
      else {
        this.afterLoadConfig(callback);
      }
    }.bind(this));
  }
  else {
    this.parsed_url = {params: {}};
    this.afterLoadConfig(callback);
  }
}

BaseComponent.prototype.processMessage = function(data) {
  if (this.message_filtering.only_type && this.message_filtering.only_type != data['type']) {
    return false;
  }

  if (this.message_filtering.only_field_exist) {
    for(var i = 0; i < this.message_filtering.only_field_exist.length; i ++) {
      if (! data[this.message_filtering.only_field_exist[i]]) {
        return false;
      }
    }
  }

  if (this.message_filtering.only_field_equal) {
    for(var i in this.message_filtering.only_field_equal) {
      if (! data[i] || data[i] != this.message_filtering.only_field_equal[i]) {
        return false;
      }
    }
  }

  return true;
}

BaseComponent.prototype.replaceByFields = function(data, s) {
  var result = s.match(/^(.*)#{([^\\}]+)}(.*)$/);
  if (result) {
    var key = result[2];
    var replaced = undefined;
    if (data[key]) {
      replaced = data[key];
    }
    if (!replaced) {
      logger.debug('Unable to find field', key);
      return undefined;
    }
    return this.replaceByFields(data, result[1] + replaced + result[3]);
  }
  return s;
}

exports.BaseComponent = BaseComponent;
