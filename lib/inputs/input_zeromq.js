var base_input = require('../lib/base_input'),
  util = require('util'),
  zmq = require('zmq'),
  logger = require('log4node');

function InputZeroMQ() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Zeromq',
    host_field: 'address',
    optional_params: ['type'],
    start_hook: this.start,
  });
}

util.inherits(InputZeroMQ, base_input.BaseInput);

InputZeroMQ.prototype.start = function(callback) {
  logger.info('Start listening on zeromq', this.address, 'using ZeroMQ', zmq.version);

  this.socket = zmq.socket('pull');
  this.socket.bind(this.address, function(err) {
    if (err) {
      return callback(err);
    }
    logger.info('Zeromq ready on ' + this.address);

    callback();
  }.bind(this));

  this.socket.on('message', function(data) {
    this.unserialize_data(data, function(parsed) {
      this.emit('data', parsed);
    }.bind(this), function(data) {
      var obj = {
        'message': data.toString().trim(),
        'zeromq_from': this.address,
        'type': this.type,
      };
      this.emit('data', obj);
    }.bind(this));
  }.bind(this));
};

InputZeroMQ.prototype.close = function(callback) {
  logger.info('Closing input zeromq', this.address);
  this.socket.close();
  callback();
};

exports.create = function() {
  return new InputZeroMQ();
};
