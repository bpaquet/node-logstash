var base_output = require('../lib/base_output'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    url = require('url'),
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
    optional_params: ['proxy', 'proxy_auth', 'proxy_ntlm_domain'],
    start_hook: this.startAbstract
  });
}

util.inherits(AbstractHttp, base_output.BaseOutput);

AbstractHttp.prototype.setupProxy = function() {
  var ProxyingAgent = this.requireLib('proxying-agent').ProxyingAgent;

  // create the proxy agent
  var proxyingOptions = {
    proxy: this.proxy,
    tunnel: this.ssl,
    authType: this.proxy_auth || 'basic',
    ntlm: {
      domain: this.proxy_ntlm_domain
    }
  };
  this.proxyingAgent = new ProxyingAgent(proxyingOptions);

  var proxyUrl = url.parse(this.proxy);
  delete proxyUrl.auth;
  logger.info('Using HTTP proxy ' + url.format(proxyUrl));
};

AbstractHttp.prototype.startAbstract = function(callback) {
  logger.info('Start HTTP output to' + this.to());

  if (this.proxy) {
    this.setupProxy();
  }

  // tls options are not copied in old node version
  if (this.ssl && process.versions.node.split('.')[1] < 10) {
    var ssl_options = ssl_helper.merge_options(this, {});
    for(var x in ssl_options) {
      if (this.proxyingAgent) {
        this.proxyingAgent.options[x] = ssl_options[x];
      }
      else {
        https.globalAgent.options[x] = ssl_options[x];
      }
    }
  }

  callback();
};

AbstractHttp.prototype.process = function(data) {
  this.formatPayload(data, function(http_options, body) {
    if (this.proxyingAgent) {
      http_options.agent = this.proxyingAgent;
    }
    if (this.path_prefix) {
      http_options.path = this.path_prefix + http_options.path;
    }
    var listener = function(res) {
      if(res.statusCode < 200 || res.statusCode > 299 ) {
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

    // write to the socket only once the socket has been assigned to the request.
    // we do this so we'll play nice with proxies and proxy authentication.
    req.on('socket', function(socket) {
      req.write(body);
      req.end();
    }.bind(this));

  }.bind(this));
};

AbstractHttp.prototype.close = function(callback) {
  logger.info('Closing HTTP Post output to', this.host, this.port, 'ssl ' + this.ssl);
  callback();
};

exports.AbstractHttp = AbstractHttp;
