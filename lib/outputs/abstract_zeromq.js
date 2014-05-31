var base_output = require('../lib/base_output'),
  util = require('util'),
  zmq = require('zmq'),
  logger = require('log4node');

function AbstractZeroMQ() {
  base_output.BaseOutput.call(this);
  this.mergeConfig({
    name: 'Abstract ZeroMQ',
    host_field: 'target',
    optional_params: ['zmq_high_watermark', 'zmq_threshold_up', 'zmq_threshold_down', 'zmq_check_interval'],
    start_hook: this.startAbstract,
  });
}

util.inherits(AbstractZeroMQ, base_output.BaseOutput);

AbstractZeroMQ.prototype.startAbstract = function(callback) {
  logger.info('Start output to', this.to(), 'using ZeroMQ', zmq.version);

  this.socket = zmq.socket('push');
  if (this.zmq_high_watermark) {
    logger.info('Setting high watermark on ZeroMQ socket', this.zmq_high_watermark);
    if (zmq.version.match(/^2\./)) {
      this.socket.setsockopt(zmq.ZMQ_HWM, parseInt(this.zmq_high_watermark, 10));
    }
    else {
      this.socket.setsockopt(zmq.ZMQ_SNDHWM, parseInt(this.zmq_high_watermark, 10));
    }
  }
  this.target.split(',').forEach(function(address) {
    this.socket.connect(address);
  }.bind(this));

  if (this.zmq_check_interval) {
    this.check_interval_id = setInterval(function() {
      this.check();
    }.bind(this), this.zmq_check_interval);
  }

  this.on_alarm = false;

  callback();
};

AbstractZeroMQ.prototype.check = function() {
  if (this.on_alarm && this.zmq_threshold_down && this.socket._outgoing.length < this.zmq_threshold_down) {
    logger.warning('Zmq socket end of alarm', this.target, 'current queue size', this.socket._outgoing.length);
    this.on_alarm = false;
    this.emit('alarm', false, this.target);
  }
};

AbstractZeroMQ.prototype.process = function(data) {
  this.formatPayload(data, function(message) {
    this.socket.send(message);
    if (!this.on_alarm && this.zmq_threshold_up && this.socket._outgoing.length > this.zmq_threshold_up) {
      logger.warning('Zmq socket in alarm', this.target, 'current queue size', this.socket._outgoing.length);
      this.on_alarm = true;
      this.emit('alarm', true, this.target);
    }
  }.bind(this));
};

AbstractZeroMQ.prototype.close = function(callback) {
  logger.info('Closing output to zeromq', this.target);
  if (this.zmq_check_interval_id) {
    clearInterval(this.zmq_check_interval_id);
  }
  this.socket.close();
  callback();
};

exports.AbstractZeroMQ = AbstractZeroMQ;
