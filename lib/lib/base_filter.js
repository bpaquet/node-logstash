var base_component = require('./base_component'),
  util = require('util'),
  logger = require('log4node');

function BaseFilter() {
  base_component.BaseComponent.call(this);
}

util.inherits(BaseFilter, base_component.BaseComponent);

BaseFilter.prototype.init = function(url, callback) {
  logger.info('Initializing filter', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      return callback(err);
    }

    this.on('input', function(data) {
      if (this.processMessage(data)) {
        var res = this.process(data);
        if (res) {
          if (res.length === undefined) {
            res = [res];
          }
          for (var i = 0; i < res.length; i++) {
            this.emit('output', res[i]);
          }
        }
      }
      else {
        this.emit('output', data);
      }
    }.bind(this));

    callback();
  }.bind(this));
};

BaseFilter.prototype.tags_fields_config = function() {
  return {
    optional_params: ['add_tags', 'remove_tags', 'add_fields', 'add_field', 'remove_field', 'remove_fields'],
    arrays: ['add_tags', 'remove_tags', 'remove_field', 'remove_fields'],
    hashes: ['add_fields', 'add_field'],
    start_hook: this.start_tags_fields_config.bind(this),
  };
};

BaseFilter.prototype.start_tags_fields_config = function(callback) {
  if (this.add_field) {
    this.add_fields = this.add_field;
  }
  if (this.remove_field) {
    this.remove_fields = this.remove_field;
  }
  callback();
};

BaseFilter.prototype.close = function(callback) {
  callback();
};

exports.BaseFilter = BaseFilter;
