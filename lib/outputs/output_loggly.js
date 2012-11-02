var base_output = require('../lib/base_output'),
    util = require('util'),
    // loggly = require('loggly'),
    http = require('http'),
    https = require('https'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputLoggly() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Loggly',
    host_field: 'subdomain',
    port_field: null,
    allow_empty_host: true,
    required_params: ['input_key'],
    optional_params: ['error_buffer_delay', 'proto', 'send_json'],
    default_values: {
      'error_buffer_delay': 2000,
      'subdomain': 'logs',
      'proto': 'http',
      'send_json': 'true'
    }
  }
  http.globalAgent.maxSockets = 100;
}

util.inherits(OutputLoggly, base_output.BaseOutput);

OutputLoggly.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to loggly ', this.input_key);
  this.error_buffer = error_buffer.create('output loggly to ' + this.input_key, this.error_buffer_delay, this);
  //this.logglyClient = loggly.createClient({subdomain:this.subdomain,json:true});
  this.http_options = {
    host: this.subdomain+'.loggly.com',
    path: '/inputs/'+this.input_key,
    method: 'POST'
  };
  callback();
}

OutputLoggly.prototype.process = function(data) {
  var proto = (this.proto=='https' ? https : http);
  logger.info('Loggly URL', this.proto, this.http_options.host+this.http_options.path);
  var req = proto.request(this.http_options, function(res) {
    if(res.statusCode == 200) {
      logger.info("Event send to Loggly OK!");
    } else {
      logger.warning("Loggly HTTP error", res.statusCode);
    }
  });
  

  req.on('error', function(e) {
    this.error_buffer.emit('error', e.message);
  }.bind(this));

  // write data to request body
  if(this.send_json=='true') {
    req.write(JSON.stringify(data.toJSON()));
  } else {
    req.write(data.getMessage());
  }
  req.end();
}

OutputLoggly.prototype.close = function(callback) {
  logger.info('Closing output to loggly', this.input_key);
  callback();
}

exports.create = function() {
  return new OutputLoggly();
}
