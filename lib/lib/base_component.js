var events = require('events'),
    util = require('util'),
    fs = require('fs'),
    url_parser = require('../lib/url_parser'),
    logger = require('log4node');

function BaseComponent() {
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
  this.required_libs = {};
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
  ['name', 'host_field', 'port_field'].forEach(function(x) {
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

BaseComponent.prototype.enable_ssl = function() {
  this.merge_config({
    optional_params: ['ssl', 'ssl_pfx', 'ssl_key', 'ssl_passphrase', 'ssl_cert', 'ssl_ca', 'ssl_crl', 'ssl_ciphers', 'ssl_handshakeTimeout', 'ssl_honorCipherOrder', 'ssl_requestCert', 'ssl_rejectUnauthorized', 'ssl_sessionIdContext', 'ssl_secureProtocol'],
    default_values: {
      'ssl': false,
    }
  });
}

BaseComponent.prototype.merge_ssl_options = function(options) {
  for(var x in this) {
    var result = x.match(/ssl_(.*)/);
    if (result && typeof this[x] != 'function') {
      options[result[1]] = this[x];
    }
  }
  return options;
}

BaseComponent.prototype.load_ssl_files = function(callback, list) {
  if (list == undefined) {
    return this.load_ssl_files(callback, ['ssl_key', 'ssl_cert', 'ssl_ca', 'ssl_crl', 'ssl_pfx']);
  }
  if (list.length == 0) {
    return callback();
  }
  var to_check = list.shift();
  if (this[to_check]) {
    logger.info('Load SSL file', to_check, this[to_check]);
    fs.readFile(this[to_check], function(err, result) {
      if (err) {
        return this.emit('init_error', err);
      }
      this[to_check] = result;
      this.load_ssl_files(callback, list);
    }.bind(this));
  }
  else {
    this.load_ssl_files(callback, list);
  }
}

BaseComponent.prototype.loadConfig = function(url, callback) {
  this.message_filtering = {};

  if (this.config.host_field || this.config.port_field || this.config.required_params || this.config.optional_params) {
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
          this[this.config.required_params[i]] = val;
        }
      }
    }

    if (this.config.optional_params) {
      for(var i = 0; i < this.config.optional_params.length; i ++) {
        var val = this.parsed_url.params[this.config.optional_params[i]];
        if (val) {
          this[this.config.optional_params[i]] = val;
        }
      }
    }

    if (this.config.default_values) {
      for(var i in this.config.default_values) {
        if (!this[i]) {
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

      if (this.enable_ssl) {
        this.load_ssl_files(function() {
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
