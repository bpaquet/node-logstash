var base_filter = require('./base_filter'),
  util = require('util');

function BaseFilterBuffer() {
  base_filter.BaseFilter.call(this);
  this.storage = {};
}

util.inherits(BaseFilterBuffer, base_filter.BaseFilter);

BaseFilterBuffer.prototype.computeKey = function(data) {
  return data.type + data.host + data.source;
};

BaseFilterBuffer.prototype.store = function(key, data) {
  if (!this.storage[key]) {
    this.storage[key] = {
      first: data,
      current: '',
    };
  }
  else {
    this.storage[key].current += '\n';
  }
  this.storage[key].current += data.message;
  this.storage[key].last = (new Date()).getTime();
};

BaseFilterBuffer.prototype.sendIfNeeded = function(key) {
  if (this.storage[key]) {
    this.sendMessage(key, this.storage[key].current);
    delete this.storage[key];
  }
};

BaseFilterBuffer.prototype.setInterval = function(delay) {
  var func = function() {
    var now = (new Date()).getTime();
    var to_be_deleted = [];
    for (var key in this.storage) {
      if (now - this.storage[key].last > delay) {
        this.sendMessage(key, this.storage[key].current);
        to_be_deleted.push(key);
      }
    }
    to_be_deleted.forEach(function(key) {
      delete this.storage[key];
    }.bind(this));
  }.bind(this);
  this.interval_id = setInterval(func, delay);
};

BaseFilterBuffer.prototype.sendMessage = function(key, current) {
  var m = JSON.parse(JSON.stringify(this.storage[key].first));
  m.message = current;
  this.emit('output', m);
};

BaseFilterBuffer.prototype.close = function(callback) {
  if (this.interval_id) {
    clearInterval(this.interval_id);
  }
  callback();
};

exports.BaseFilterBuffer = BaseFilterBuffer;
