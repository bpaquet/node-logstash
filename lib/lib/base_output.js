var base_component = require('./base_component'),
  util = require('util'),
  logger = require('log4node');

function BaseOutput() {
  base_component.BaseComponent.call(this);
}

util.inherits(BaseOutput, base_component.BaseComponent);

BaseOutput.prototype.init = function(url, callback) {
  logger.info('Initializing output', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      return callback(err);
    }

    this.on('data', function(data) {
      if (this.processMessage(data)) {
        this.process(data);
      }
    }.bind(this));

    callback();
  }.bind(this));
};

BaseOutput.prototype.configure_serialize = function(serializer, raw_format) {
  if (serializer === 'json_logstash') {
    this.serialize_data = function(data) {
      return JSON.stringify(data);
    };
  }
  else if (serializer === 'raw') {
    this.serialize_data = function(data) {
      return this.replaceByFields(data, raw_format);
    };
  }
  else if (serializer === 'msgpack') {
    var msgpack = this.requireLib('msgpack');
    this.serialize_data = function(data) {
      return msgpack.pack(data);
    };
  }
  else {
    throw new Error('Unknown serializer ' + serializer);
  }
};

BaseOutput.prototype.serializer_config = function(default_serializer) {
  return {
    optional_params: ['format', 'serializer'],
    default_values: {
      'format': '#{message}',
      'serializer': default_serializer || 'json_logstash',
    },
    start_hook: function(callback) {
      this.configure_serialize(this.serializer, this.format);
      callback();
    },
  };
};

exports.BaseOutput = BaseOutput;
