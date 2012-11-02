var base_filter = require('./base_filter'),
    util = require('util'),
    logger = require('log4node');

function BaseFilterBuffer() {
  base_filter.BaseFilter.call(this);
  this.storage = {};
}

util.inherits(BaseFilterBuffer, base_filter.BaseFilter);

BaseFilterBuffer.prototype.computeKey = function(data) {
  return data.getType() + data.getSourceHost() + data.getSource();
}

BaseFilterBuffer.prototype.store = function(key, data) {
  if (!this.storage[key]) {
    this.storage[key] = {
      first: data,
      current: '',
    }
  }
  else {
    this.storage[key].current += '\n';
  }
  this.storage[key].current += data.getMessage();
  this.storage[key].last = (new Date()).getTime();
}

BaseFilterBuffer.prototype.sendIfNeeded = function(key) {
  if (this.storage[key]) {
    this.sendMessage(key, this.storage[key].current);
    delete this.storage[key];
  }
}

BaseFilterBuffer.prototype.setInterval = function(delay) {
  this.i = function() {
    var now = (new Date()).getTime();
    var to_be_deleted = [];
    for(var key in this.storage) {
      if (now - this.storage[key].last > delay) {
        this.sendMessage(key, this.storage[key].current);
        to_be_deleted.push(key);
      }
    }
    to_be_deleted.forEach(function(key) {
      delete this.storage[key];
    }.bind(this));
  }.bind(this);
  setInterval(this.i, delay);
}

BaseFilterBuffer.prototype.sendMessage = function(key, current) {
  var m = this.storage[key].first;
  m.setMessage(current);
  this.emit('output', m);
}

BaseFilterBuffer.prototype.close = function(callback) {
  if (this['i']) {
    clearInterval(this.i);
  }
  callback();
}

exports.BaseFilterBuffer = BaseFilterBuffer;
