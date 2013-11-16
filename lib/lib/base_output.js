var base_component = require('./base_component'),
    util = require('util'),
    logger = require('log4node');

function BaseOutput() {
  base_component.BaseComponent.call(this);
}

util.inherits(BaseOutput, base_component.BaseComponent);

BaseOutput.prototype.init = function(url) {
  logger.info('Initializing output', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      this.emit('init_error', err);
      return;
    }
    this.on('data', function(data) {
      if (this.processMessage(data)) {
        this.process(data);
      }
    }.bind(this));

    this.emit('init_ok');
  }.bind(this));
}

BaseOutput.prototype.configure_serialize = function(serializer, raw_format) {
  if (serializer == 'json_logstash') {
    this.serialize_data = function(data) {
      return JSON.stringify(data);
    };
  }
  else if (serializer == 'raw') {
    if (raw_format) {
      this.serialize_data = function(data) {
        return this.replaceByFields(data, raw_format);
      };
    }
    else {
      throw new Error('Please specify format with raw serializer');
    }
  }
  else if (serializer == 'msgpack') {
    var msgpack = this.requireLib('msgpack');
    this.serialize_data = function(data) {
      return msgpack.pack(data);
    };
  }
  else {
    throw new Error('Unknown serializer ' + serializer);
  }
}

BaseOutput.prototype.serializer_config = function(default_serializer) {
  return {
    optional_params: ['format', 'serializer'],
    default_values: {
      'format': '#{message}',
      'serializer': default_serializer || 'json_logstash',
    },
    afterLoadConfigHook: function(callback) {
      this.configure_serialize(this.serializer, this.format);
      callback();
    },
  }
}

exports.BaseOutput = BaseOutput;
