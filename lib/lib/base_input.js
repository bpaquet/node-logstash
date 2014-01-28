var base_component = require('./base_component'),
  util = require('util'),
  logger = require('log4node');

function BaseInput() {
  base_component.BaseComponent.call(this);
}

util.inherits(BaseInput, base_component.BaseComponent);

BaseInput.prototype.init = function(url, callback) {
  logger.info('Initializing input', this.config.name);

  this.loadConfig(url, function(err) {
    callback(err);
  }.bind(this));
};

BaseInput.prototype.configure_unserialize = function(serializer) {
  if (serializer === 'json_logstash') {
    this.unserialize_data = this.unserialize_data_json;
  }
  else if (serializer === 'msgpack') {
    this.msgpack = this.requireLib('msgpack');
    this.unserialize_data = this.unserialize_data_msgpack;
  }
  else {
    throw new Error('Unknown serializer ' + serializer);
  }
};

BaseInput.prototype.unserialize_data_json = function(data, ok_callback, parse_fail_callback) {
  try {
    var ok = false;
    var splitted = data.toString().split('\n');
    for (var i = 0; i < splitted.length; i++) {
      if (splitted[i] !== '') {
        var parsed = JSON.parse(splitted[i]);
        if (parsed['@timestamp']) {
          ok_callback(parsed);
          ok = true;
        }
      }
    }
    if (ok) {
      return;
    }
  }
  catch (e) {}
  return parse_fail_callback(data);
};

BaseInput.prototype.unserialize_data_msgpack = function(data, ok_callback, parse_fail_callback) {
  try {
    var parsed = this.msgpack.unpack(data);
    if (parsed['@timestamp']) {
      return ok_callback(parsed);
    }
  }
  catch (e) {}
  return parse_fail_callback(data);
};

BaseInput.prototype.unserializer_config = function() {
  return {
    optional_params: ['unserializer'],
    default_values: {
      'unserializer': 'json_logstash',
    },
    start_hook: function(callback) {
      this.configure_unserialize(this.unserializer);
      callback();
    },
  };
};

exports.BaseInput = BaseInput;
