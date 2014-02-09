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

  var proxying_options = {
    tunnel: this.ssl,
  };

  var proxy_url = url.parse(this.proxy);
  if (proxy_url.auth) {
    var r = proxy_url.auth.match(/^ntlm:([^:]+):([^:]*):(.+)$/);
    if (r) {
      proxying_options.authType = 'ntlm';
      proxying_options.ntlm = {
        domain: r[1],
      };
      if (r[2].length > 0) {
        proxying_options.ntlm.workstation = r[2];
      }
      proxy_url.auth = r[3];
    }
  }

  proxying_options.proxy = url.format(proxy_url);

  this.proxying_agent = new ProxyingAgent(proxying_options);

  logger.info('Using http proxy ' + this.proxy);
};

AbstractHttp.prototype.startAbstract = function(callback) {
  logger.info('Start HTTP output to' + this.to());

  if (this.proxy) {
    this.setupProxy();
  }

  // tls options are not copied in old node version
  if (this.ssl && process.versions.node.split('.')[1] < 10) {
    var ssl_options = ssl_helper.merge_options(this, {});
    for (var x in ssl_options) {
      if (this.tunnelingAgent) {
        this.tunnelingAgent.options[x] = ssl_options[x];
      }
      else {
        https.globalAgent.options[x] = ssl_options[x];
      }
    }
  }

  callback();
};

AbstractHttp.prototype.process = function(data) {
  var data_callback = function() {};
  if (data.data_callback) {
    data_callback = data.data_callback;
    delete data.data_callback;
  }

  var end_callback = function() {};
  if (data.end_callback) {
    end_callback = data.end_callback;
    delete data.end_callback;
  }

  this.formatPayload(data, function(http_options, body) {
    if (this.proxying_agent) {
      http_options.agent = this.proxying_agent;
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
      res.on('data', data_callback);
      res.on('end', end_callback);
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
  }.bind(this));
};

AbstractHttp.prototype.close = function(callback) {
  logger.info('Closing HTTP Post output to', this.host, this.port, 'ssl ' + this.ssl);
  callback();
};

exports.AbstractHttp = AbstractHttp;
