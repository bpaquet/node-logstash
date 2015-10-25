var base_output = require('../lib/base_output'),
  util = require('util'),
  http = require('http'),
  https = require('https'),
  logger = require('log4node'),
  ssl_helper = require('../lib/ssl_helper'),
  error_buffer = require('../lib/error_buffer');

function AbstractHttp() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(ssl_helper.config());
  this.mergeConfig(error_buffer.config(function() {
    return 'output HTTP Post to ' + this.host;
  }));
  this.mergeConfig({
    name: 'Abstract Http',
    host_field: 'host',
    port_field: 'port',
    required_params: [],
    optional_params: ['proxy', 'basic_auth_password', 'basic_auth_user'],
    start_hook: this.startAbstract,
  });
}

util.inherits(AbstractHttp, base_output.BaseOutput);

AbstractHttp.prototype.startAbstract = function(callback) {
  logger.info('Start HTTP output to' + this.to());

  if (this.proxy) {
    var HttpProxyAgent = this.ssl ? require('https-proxy-agent') : require('http-proxy-agent');
    this.custom_agent = new HttpProxyAgent(this.proxy);
    logger.info('Using http proxy ' + this.proxy);
  }

  if (this.basic_auth_user && this.basic_auth_password) {
    this.basic_auth = 'Basic ' + new Buffer(this.basic_auth_user + ':' + this.basic_auth_password).toString('base64');
  }

  callback();
};

AbstractHttp.prototype.sendHttpRequest = function(http_options, body) {
  if (this.custom_agent) {
    http_options.agent = this.custom_agent;
  }
  if (this.basic_auth) {
    if (!http_options.headers) {
      http_options.headers = {};
    }
    http_options.headers.Authorization = this.basic_auth;
  }
  if (this.path_prefix) {
    http_options.path = this.path_prefix + http_options.path;
  }
  var listener = function(res) {
    if (res.statusCode < 200 || res.statusCode > 299) {
      this.error_buffer.emit('error', 'Wrong HTTP Post return code: ' + res.statusCode);
    }
    else {
      this.error_buffer.emit('ok');
    }
    res.on('data', function() {});
  }.bind(this);

  var req = this.ssl ? https.request(ssl_helper.merge_options(this, http_options), listener) : http.request(http_options, listener);

  req.on('error', function(e) {
    this.error_buffer.emit('error', e.message);
  }.bind(this));

  // wait for socket is needed is some proxy scenario
  req.once('socket', function() {
    req.write(body);
    req.end();
  });
};

AbstractHttp.prototype.close = function(callback) {
  logger.info('Closing HTTP Post output to', this.host, this.port, 'ssl ' + this.ssl);
  if (this.httpClose) {
    this.httpClose(callback);
  }
  else {
    callback();
  }
};

exports.AbstractHttp = AbstractHttp;
