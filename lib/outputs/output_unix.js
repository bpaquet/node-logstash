var base_output = require('../lib/base_output'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputUnix() {
  base_output.BaseOutput.call(this);
  this.merge_config(error_buffer.config(function() {
    return 'output to unix socket ' + this.file;
  }));
  this.merge_config(this.serializer_config());
  this.merge_config({
    name: 'UnixSocket',
    host_field: 'file',
    start_hook: this.start,
  });
}

util.inherits(OutputUnix, base_output.BaseOutput);

OutputUnix.prototype.start = function(callback) {
  logger.info('Start output on unix socket', this.file);

  callback();
};

OutputUnix.prototype.process = function(data) {
  var c = net.createConnection({path: this.file}, function() {
    c.write(this.serialize_data(data));
    c.end();
    this.error_buffer.emit('ok');
  }.bind(this));
  c.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
};

OutputUnix.prototype.close = function(callback) {
  logger.info('Closing output to unix socket output', this.file);
  callback();
};

exports.create = function() {
  return new OutputUnix();
};
