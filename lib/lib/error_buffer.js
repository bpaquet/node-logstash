var events = require('events'),
  util = require('util');

function ErrorBuffer() {
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
}

util.inherits(ErrorBuffer, events.EventEmitter);

ErrorBuffer.prototype.init = function(name, delay, target) {
  this.target = target;
  this.on_error = false;
  this.last_check = undefined;

  this.on('error', function(err) {
    if (!this.on_error) {
      this.on_error = true;
      this.last_check = new Date();
      this.target.emit('error', name + ' start failing: ' + err);
    }
    else {
      if ((new Date()) - this.last_check > delay) {
        this.last_check = new Date();
        this.target.emit('error', name + ' still failing.');
      }
    }
  }.bind(this));

  this.on('ok', function() {
    if (this.on_error) {
      this.on_error = false;
      this.target.emit('error', name + ' is back to normal.');
    }
  }.bind(this));
};

function create(name, delay, target) {
  var e = new ErrorBuffer();
  e.init(name, delay, target);
  return e;
}

exports.create = create;

exports.config = function(fname) {
  return {
    optional_params: ['error_buffer_delay'],
    default_values: {
      'error_buffer_delay': 2000,
    },
    start_hook: function(callback) {
      this.error_buffer = create(fname.call(this), this.error_buffer_delay, this);
      callback();
    },
  };
};
