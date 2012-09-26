var events = require('events'),
    util = require('util'),
    url_parser = require('../lib/url_parser'),
    logger = require('log4node');

function BaseComponent() {
  events.EventEmitter.call(this);
}

util.inherits(BaseComponent, events.EventEmitter);

BaseComponent.prototype.extendedLoadConfig = function(callback) {
  callback();
}

BaseComponent.prototype.loadConfig = function(url, callback) {
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

    this.extendedLoadConfig(function(err) {
      if (err) {
        return callback(err);
      }

      if (this.config.required_params) {
        for(var i = 0; i < this.config.required_params.length; i ++) {
          var val = this.parsed_url.params[this.config.required_params[i]];
          if (val) {
            this[this.config.required_params[i]] = val;
          }
        }
      }

      this.afterLoadConfig(callback);
    }.bind(this));
  }
  else {
    this.parsed_url = {params: {}};
    this.afterLoadConfig(callback);
  }
}

BaseComponent.prototype.processMessage = function(data) {
  if (this.parsed_url.params.type && this.parsed_url.params.type != data['@type']) {
    return false;
  }
  return true;
}

exports.BaseComponent = BaseComponent;
