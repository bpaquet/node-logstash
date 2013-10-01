var base_output = require('../lib/base_output'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function AbstractHttp() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Abstract Http',
    host_field: 'host',
    port_field: 'port',
    required_params: [],
    optional_params: ['error_buffer_delay', 'proto'],
    default_values: {
      'error_buffer_delay': 2000,
      'proto': 'http',
    }
  }
}

util.inherits(AbstractHttp, base_output.BaseOutput);

AbstractHttp.prototype.abstractAfterLoadConfig = function(callback) {
  logger.info('Start HTTP output to' + this.to());

  this.error_buffer = error_buffer.create('output HTTP Post to ' + this.host, this.error_buffer_delay, this);

  this.proto_m = (this.proto == 'https' ? https : http);

  callback();
}

AbstractHttp.prototype.process = function(data) {
  this.format_payload(data, function(http_options, body) {
    var req = this.proto_m.request(http_options, function(res) {
      if(res.statusCode < 200 || res.statusCode > 299 ) {
        this.error_buffer.emit('error', 'Wrong HTTP Post return code: ' + res.statusCode);
      }
      res.on('data', function() {});
    }.bind(this));

    req.on('error', function(e) {
      this.error_buffer.emit('error', e.message);
    }.bind(this));

    req.write(body);
    req.end();
  }.bind(this));
}

AbstractHttp.prototype.close = function(callback) {
  logger.info('Closing HTTP Post output to', this.proto, this.host, this.port);
  callback();
}

exports.AbstractHttp = AbstractHttp;