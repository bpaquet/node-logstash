var events = require('events'),
  util = require('util'),
  url_parser = require('../lib/url_parser'),
  async = require('async'),
  moment = require('moment'),
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
  this.start_hooks = [];
  this.config_hooks = [];
}

util.inherits(BaseComponent, events.EventEmitter);

BaseComponent.prototype.requireLib = function (name) {
  if (!this.required_libs[name]) {
    try {
      this.required_libs[name] = require(name);
    }
    catch (e) {
      console.error('Unable to load module', name);
      throw e;
    }
  }
  return this.required_libs[name];
};

BaseComponent.prototype.mergeConfig = function (config) {
  ['name', 'host_field', 'port_field', 'allow_empty_host'].forEach(function (x) {
    if (config[x]) {
      this.config[x] = config[x];
    }
  }.bind(this));
  ['required_params', 'optional_params'].forEach(function (x) {
    if (config[x]) {
      this.config[x] = this.config[x].concat(config[x]);
    }
  }.bind(this));
  if (config.default_values) {
    for (var x in config.default_values) {
      this.config.default_values[x] = config.default_values[x];
    }
  }
  if (config.start_hook) {
    this.start_hooks.push(config.start_hook);
  }
  if (config.config_hook) {
    this.config_hooks.push(config.config_hook);
  }
};

BaseComponent.prototype.processValue = function (x) {
  if (x === 'true') {
    return true;
  }
  else if (x === 'false') {
    return false;
  }
  return x;
};

BaseComponent.prototype.loadConfig = function(url, callback) {
  this.message_filtering = {};

  var val, i, res;

  if (url.length === 0) {
    if (this.config.host_field || this.config.port_field || this.config.required_params.length > 0 || this.config.optional_params.length > 0) {
      return callback(new Error('No empty url for ' + this.config.name));
    }
    this.parsed_url = {
      params: [],
    };
  }
  else {
    this.parsed_url = url_parser.processUrlContent(url);
    if (!this.parsed_url) {
      return callback(new Error('Unable to parse config : ' + url));
    }
  }

  if (this.config.host_field) {
    if (!this.parsed_url.host && !this.config.allow_empty_host) {
      return callback(new Error('No host found in url ' + url));
    }

    if (this.config.port_field && this.config.port_field !== -1) {
      var p = url_parser.extractPortNumber(this.parsed_url.host);
      if (!p) {
        return callback(new Error('Unable to extract port from ' + this.parsed_url.host));
      }
      this[this.config.host_field] = p.host;
      this[this.config.port_field] = p.port;
    }
    else {
      this[this.config.host_field] = this.parsed_url.host;
    }
  }

  if (this.config.required_params) {
    for (i = 0; i < this.config.required_params.length; i++) {
      val = this.parsed_url.params[this.config.required_params[i]];
      if (val) {
        this[this.config.required_params[i]] = this.processValue(val);
      }
    }
  }

  if (this.config.optional_params) {
    for (i = 0; i < this.config.optional_params.length; i++) {
      val = this.parsed_url.params[this.config.optional_params[i]];
      if (val !== undefined) {
        this[this.config.optional_params[i]] = this.processValue(val);
      }
    }
  }

  if (this.config.default_values) {
    for (i in this.config.default_values) {
      if (this[i] === undefined) {
        this[i] = this.config.default_values[i];
      }
    }
  }

  if (this.parsed_url.params.only_type) {
    this.message_filtering.only_type = this.parsed_url.params.only_type.split(',');
  }

  if (this.parsed_url.params.not_type) {
    this.message_filtering.not_type = this.parsed_url.params.not_type.split(',');
  }

  for (i in this.parsed_url.params) {
    res = i.match(/^only_field_exist_(.+)$/);
    if (res) {
      if (!this.message_filtering.only_field_exist) {
        this.message_filtering.only_field_exist = [];
      }
      this.message_filtering.only_field_exist.push(res[1]);
    }
    res = i.match(/^only_field_equal_(.+)$/);
    if (res) {
      if (!this.message_filtering.only_field_equal) {
        this.message_filtering.only_field_equal = {};
      }
      this.message_filtering.only_field_equal[res[1]] = this.parsed_url.params[i];
    }
    res = i.match(/^only_field_match_(.+)$/);
    if (res) {
      if (!this.message_filtering.only_field_match) {
        this.message_filtering.only_field_match = {};
      }
      this.message_filtering.only_field_match[res[1]] = new RegExp(this.parsed_url.params[i]);
    }
  }

  async.eachSeries(this.config_hooks, function(hook, callback) {
    hook.call(this, callback);
  }.bind(this), function(err) {
    if (err) {
      return callback(err);
    }

    if (this.config.required_params) {
      for (var i = 0; i < this.config.required_params.length; i++) {
        if (!this[this.config.required_params[i]]) {
          return callback(new Error('You have to specify ' + this.config.required_params[i] + ' in url ' + url));
        }
      }
    }

    async.eachSeries(this.start_hooks, function(hook, callback) {
      hook.call(this, callback);
    }.bind(this), callback);
  }.bind(this));

};

BaseComponent.prototype.processMessage = function (data) {
  var i;

  if (this.message_filtering.not_type && (this.message_filtering.not_type.indexOf(data.type) !== -1)) {
    return false;
  }

  if (this.message_filtering.only_type && (this.message_filtering.only_type.indexOf(data.type) === -1)) {
    return false;
  }

  if (this.message_filtering.only_field_exist) {
    for (i = 0; i < this.message_filtering.only_field_exist.length; i++) {
      if (!data[this.message_filtering.only_field_exist[i]]) {
        return false;
      }
    }
  }

  if (this.message_filtering.only_field_equal) {
    for (i in this.message_filtering.only_field_equal) {
      if (!data[i] || data[i] !== this.message_filtering.only_field_equal[i]) {
        return false;
      }
    }
  }

  if (this.message_filtering.only_field_match) {
    for (i in this.message_filtering.only_field_match) {
      if (!data[i] || !this.message_filtering.only_field_match[i].exec(data[i])) {
        return false;
      }
    }
  }

  return true;
};

var replace_cache = {};

BaseComponent.prototype.replaceByFields = function(data, s) {
  if (!replace_cache[s]) {
    var x = [];
    var keep = s;
    while(true) {
      var result = keep.indexOf('#{');
      var end = result === -1 ? -1 : keep.substring(result + 2).indexOf('}');
      if (result !== -1 && end !== -1) {
        x.push({
          type: 'string',
          string: keep.substring(0, result),
        });
        var key = keep.substring(result + 2, result + end + 2);
        var date = key.match(/now:(.*)$/);
        if (date) {
          x.push({
            type: 'now',
            format: date[1],
          });
        }
        else {
          x.push({
            type: 'value',
            value: key,
          });
        }
        keep = keep.substring(result + end + 3);
      }
      else {
        if (keep.length > 0) {
          x.push({
            type: 'string',
            string: keep,
          });
        }
        break;
      }
    }
    replace_cache[s] = x;
  }
  var cache = replace_cache[s];
  var r = '';
  for(var i = 0; i < cache.length; i ++) {
    if (cache[i].type === 'string') {
      r += cache[i].string;
    }
    else if (cache[i].type === 'now') {
      r += moment().format(cache[i].format);
    }
    else if (cache[i].type === 'value') {
      if (data[cache[i].value]) {
        r += data[cache[i].value];
      }
      else {
        logger.debug('Unable to find field', cache[i].value);
        return undefined;
      }
    }
  }
  return r;
};

exports.BaseComponent = BaseComponent;
