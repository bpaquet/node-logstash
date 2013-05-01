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

BaseInput.prototype.extract_json_logstash_event = function(data, ok_callback, parse_fail_callback) {
  try {
    var parsed = JSON.parse(data);
    if (parsed['@message'] && parsed['@source'] && parsed['@type']) {
      return ok_callback(parsed);
    }
  }
  catch(e) {
  }
  return parse_fail_callback(data);
}

exports.BaseInput = BaseInput;
