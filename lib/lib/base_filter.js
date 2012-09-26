var base_component = require('./base_component'),
    util = require('util'),
    logger = require('log4node');

function BaseFilter() {
  base_component.BaseComponent.call(this);
}

util.inherits(BaseFilter, base_component.BaseComponent);

BaseFilter.prototype.init = function(url) {
  logger.info('Initializing filter', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      return;
    }
    this.on('input', function(data) {
      if (this.processMessage(data)) {
        this.process(data);
      }
      this.emit('output', data);
    }.bind(this));

    this.emit('init_ok');
  }.bind(this));
}

exports.BaseFilter = BaseFilter;
