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

exports.BaseInput = BaseInput;
