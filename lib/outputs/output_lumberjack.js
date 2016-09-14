var base_output = require('../lib/base_output'),
  util = require('util'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer'),
  ssl_helper = require('../lib/ssl_helper'),
  lumberjack = require('lumberjack-protocol');

function OutputLumberJack() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(ssl_helper.config());
  this.mergeConfig(error_buffer.config(function() {
    return 'lumber jack to ' + this.host + ':' + this.port;
  }));
  this.mergeConfig({
    name: 'Lumber Jack',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['crt', 'key', 'ca', 'max_queue_size'],
    default_values: {
      max_queue_size: 500,
    },
    start_hook: this.start,
  });
}

util.inherits(OutputLumberJack, base_output.BaseOutput);

OutputLumberJack.prototype.start = function(callback) {
  logger.info('Creating LumberJack output to', this.host + ':' + this.port, 'using ca', this.ca);
  var options = {
    maxQueueSize: this.max_queue_size,
  };
  var tls_options = ssl_helper.merge_options(this, {
    host: this.host,
    port: this.port,
  });
  this.client = lumberjack.client(tls_options, options);
  this.client.on('dropped', function(count) {
    this.error_buffer.emit('error', new Error('Dropping data, queue size :' + count));
  }.bind(this));
  callback();
};

OutputLumberJack.prototype.process = function(data) {
  if (this.client) {
    this.client.writeDataFrame(data, function() {
      this.error_buffer.emit('ok');
    }.bind(this));
  }
};

OutputLumberJack.prototype.close = function(callback) {
  logger.info('Closing LumberJack output to', this.host + ':' + this.port);
  if (this.client) {
    this.client.close();
  }
  callback();
};

exports.create = function() {
  return new OutputLumberJack();
};
