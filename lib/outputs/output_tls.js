var base_output = require('../lib/base_output'),
    util = require('util'),
    tls = require('tls'),
    fs = require('fs'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputTLS() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Tls',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['error_buffer_delay', 'format', 'serializer', 'key', 'cert', 'ca', 'rejectUnauthorized', 'secureProtocol'],
    default_values: {
      'error_buffer_delay': 10000,
      'format': '#{@message}',
      'serializer': 'json_logstash',
      'key': null,
      'cert': null,
      'ca': null,
      'rejectUnauthorized': true,
      'secureProtocol': 'SSLv3_method'
    }
  }
}

util.inherits(OutputTLS, base_output.BaseOutput);

OutputTLS.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to tls', this.host + ':' + this.port);

  this.configure_serialize(this.serializer, this.format);

  this.error_buffer = error_buffer.create('output tls to ' + this.host + ':' + this.port, this.error_buffer_delay, this);
  callback();
}

OutputTLS.prototype.process = function(data) {
  var tls_options = { host: this.host,
                      port: this.port,
                      key: fs.readFileSync(this.key),
                      cert: fs.readFileSync(this.cert),
                      ca: this.ca ? fs.readFileSync(this.ca) : null,
                      rejectUnauthorized: this.rejectUnauthorized.toLowerCase() == 'false' ? false : true,
                      secureProtocol: this.secureProtocol
  }

  var c = tls.connect(tls_options, function() {
    c.write(this.serialize_data(data));
    c.end();
  }.bind(this));
  c.on('error', function(err) {
    this.error_buffer.emit('error', err);
  }.bind(this));
}

OutputTLS.prototype.close = function(callback) {
  logger.info('Closing output to tls', this.host + ':' + this.port);
  callback();
}

exports.create = function() {
  return new OutputTLS();
}
