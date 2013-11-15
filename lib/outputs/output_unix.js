var base_output = require('../lib/base_output'),
    util = require('util'),
    net = require('net'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputUnix() {
  base_output.BaseOutput.call(this);
  this.merge_config({
    name: 'UnixSocket',
    host_field: 'file',
    optional_params: ['format', 'serializer'],
    default_values: {
      'format': '#{message}',
      'serializer': 'json_logstash',
    }
  });
  this.merge_config(error_buffer.config());
}

util.inherits(OutputUnix, base_output.BaseOutput);

OutputUnix.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output on unix socket', this.file);

  this.configure_serialize(this.serializer, this.format);

  this.error_buffer = error_buffer.create('output unix to ' + this.file, this.error_buffer_delay, this);

  callback();
}

OutputUnix.prototype.process = function(data) {
  var c = net.createConnection({path: this.file}, function() {
    c.write(this.serialize_data(data));
    c.end();
    this.error_buffer.emit('ok');
  }.bind(this));
  c.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
}

OutputUnix.prototype.close = function(callback) {
  logger.info('Closing output to unix socket output', this.file);
  callback();
}

exports.create = function() {
  return new OutputUnix();
}
