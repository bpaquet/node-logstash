var base_filter = require('./base_filter'),
    util = require('util'),
    logger = require('log4node');

function BaseFilterBuffer() {
  base_filter.BaseFilter.call(this);
  this.storage = {};
}

util.inherits(BaseFilterBuffer, base_filter.BaseFilter);

BaseFilterBuffer.prototype.computeKey = function(data) {
  key = data['@type'] + data['@source_host'] + data['@source'];
  return key;
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
  this.storage[key].current += data['@message'];
  this.storage[key].last = (new Date()).getTime();
}

BaseFilterBuffer.prototype.sendIfNeeded = function(key) {
  if (this.storage[key]) {
    this.sendMessage(key, this.storage[key].current);
    delete this.storage[key];
  }
}

BaseFilterBuffer.prototype.getCurrent = function(key) {
  var d = this.storage[key];
  return d ? d.current : undefined;
}

BaseFilterBuffer.prototype.setInterval = function(delay) {
  this.i = function() {
    var now = (new Date()).getTime();
    for(var key in this.storage) {
      if (now - this.storage[key].last > delay) {
        this.sendMessage(key, this.storage[key].current);
        delete this.storage[key];
      }
    }
  }.bind(this);
  setInterval(this.i, delay);
}

BaseFilterBuffer.prototype.sendMessage = function(key, current) {
  var m = JSON.parse(JSON.stringify(this.storage[key].first));
  m['@message'] = current;
  this.emit('output', m);
}

BaseFilterBuffer.prototype.close = function(callback) {
  if (this['i']) {
    clearInterval(this.i);
  }
  callback();
}

exports.BaseFilterBuffer = BaseFilterBuffer;
