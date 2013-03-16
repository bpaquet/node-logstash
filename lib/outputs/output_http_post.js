var base_output = require('../lib/base_output'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputHTTPPost() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'HTTP Post',
    host_field: 'host',
    port_field: 'port',
    required_params: ['path'],
    optional_params: ['error_buffer_delay', 'proto', 'format', 'output_type'],
    default_values: {
      'error_buffer_delay': 2000,
      'proto': 'http',
      'format': '#{@message}',
      'output_type': 'raw',
    }
  }
}

util.inherits(OutputHTTPPost, base_output.BaseOutput);

OutputHTTPPost.prototype.afterLoadConfig = function(callback) {
  if (this.output_type != 'raw' && this.output_type != 'json') {
    return this.emit('init_error', 'Wrong output_type value: ' + this.output_type);
  }
  logger.info('Start HTTP Post output to:', this.proto, this.host, this.port);
  this.error_buffer = error_buffer.create('output HTTP Post to ' + this.host, this.error_buffer_delay, this);
  this.proto_m = (this.proto == 'https' ? https : http);
  callback();
}

OutputHTTPPost.prototype.process = function(data) {
  var path = this.replaceByFields(data, this.path);
  if(path) {
    var http_options = {
      host: this.host,
      port: this.port,
      path: path,
      method: 'POST',
      headers: {'Content-Type': this.output_type == 'json' ? 'application/json' : 'text/plain'},
    };
    var line = undefined;
    if (this.output_type == 'json') {
      line = JSON.stringify(data);
    }
    else {
      line = this.replaceByFields(data, this.format);
    }
    if (line) {
      var req = this.proto_m.request(http_options, function(res) {
        if(res.statusCode < 200 || res.statusCode > 299 ) {
          this.error_buffer.emit('error', 'Wrong HTTP Post return code: ' + res.statusCode);
        }
        res.on('data', function() {});
      }.bind(this));

      req.on('error', function(e) {
        this.error_buffer.emit('error', e.message);
      }.bind(this));

      req.write(line);
      req.end();
    }
  }
}

OutputHTTPPost.prototype.close = function(callback) {
  logger.info('Closing HTTP Post output to', this.proto, this.host, this.port);
  callback();
}

exports.create = function() {
  return new OutputHTTPPost();
}