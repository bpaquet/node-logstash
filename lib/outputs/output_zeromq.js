var base_output = require('../lib/base_output'),
    util = require('util'),
    zmq = require('zmq'),
    logger = require('log4node');

function OutputZeroMQ() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(this.serializer_config());
  this.mergeConfig({
    name: 'Zeromq',
    host_field: 'target',
    optional_params: ['zmq_high_watermark', 'zmq_threshold_up', 'zmq_threshold_down', 'zmq_check_interval'],
    start_hook: this.start,
  });
}

util.inherits(OutputZeroMQ, base_output.BaseOutput);

OutputZeroMQ.prototype.start = function(callback) {
  logger.info('Start output to zeromq', this.target);

  this.socket = zmq.socket('push');
  if (this.zmq_high_watermark) {
    logger.info('Setting high watermark on ZeroMQ socket', this.zmq_high_watermark);
    this.socket.setsockopt('hwm', parseInt(this.zmq_high_watermark, 10));
  }
  this.socket.connect(this.target);

  if (this.zmq_check_interval) {
    this.check_interval_id = setInterval(function() {
      this.check();
    }.bind(this), this.zmq_check_interval);
  }

  this.on_alarm = false;

  callback();
};

OutputZeroMQ.prototype.check = function() {
  if (this.on_alarm && this.zmq_threshold_down && this.socket._outgoing.length < this.zmq_threshold_down) {
    logger.warning('Zmq socket end of alarm', this.target, 'current queue size', this.socket._outgoing.length);
    this.on_alarm = false;
    this.emit('alarm', false, this.target);
  }
  if (this.socket._outgoing.length > 0) {
    logger.debug('Flushing zmq socket', this.target, 'current queue size', this.socket._outgoing.length);
    this.socket._flush();
  }
};

OutputZeroMQ.prototype.process = function(data) {
  this.socket.send(this.serialize_data(data));
  if (!this.on_alarm && this.zmq_threshold_up && this.socket._outgoing.length > this.zmq_threshold_up) {
    logger.warning('Zmq socket in alarm', this.target, 'current queue size', this.socket._outgoing.length);
    this.on_alarm = true;
    this.emit('alarm', true, this.target);
  }
};

OutputZeroMQ.prototype.close = function(callback) {
  logger.info('Closing output to zeromq', this.target);
  if (this.zmq_check_interval_id) {
    clearInterval(this.zmq_check_interval_id);
  }
  this.socket.close();
  callback();
};

exports.create = function() {
  return new OutputZeroMQ();
};
