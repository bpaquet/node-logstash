var base_component = require('./base_component'),
    util = require('util'),
    logger = require('log4node');

function BaseInput() {
  base_component.BaseComponent.call(this);
}

util.inherits(BaseInput, base_component.BaseComponent);

BaseInput.prototype.init = function(url) {
  logger.info('Initializing input', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      this.emit('init_error', err);
      return;
    }

    this.emit('init_ok');
  }.bind(this));
}

aseInput.prototype.configure_unserialize = function(serializer) {
  if (serializer == 'json_logstash') {
    this.unserialize_data = this.unserialize_data_json;
  }
  else if (serializer == 'msgpack') {
    this.msgpack = this.requireLib('msgpack');
    this.unserialize_data = this.unserialize_data_msgpack;
  }
  else {
    throw new Error('Unknown serializer ' + serializer);
  }
}

BaseInput.prototype.unserialize_data_json = function(data, ok_callback, parse_fail_callback) {
  try {
    var parsed = JSON.parse(data);
    if (parsed['@timestamp']) {
      return ok_callback(parsed);
    }
  }
  catch(e) {
  }
  return parse_fail_callback(data);
}

BaseInput.prototype.unserialize_data_msgpack = function(data, ok_callback, parse_fail_callback) {
  try {
    var parsed = this.msgpack.unpack(data);
    if (parsed['@timestamp']) {
      return ok_callback(parsed);
    }
  }
  catch(e) {
  }
  return parse_fail_callback(data);
}

exports.BaseInput = BaseInput;
