var base_output = require('../lib/base_output'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    url = require('url'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function AbstractHttp() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Abstract Http',
    host_field: 'host',
    port_field: 'port',
    required_params: [],
    optional_params: ['error_buffer_delay', 'ssl', 'proxy'],
    default_values: {
      'error_buffer_delay': 2000,
    }
  }
  this.enable_ssl();
}

util.inherits(AbstractHttp, base_output.BaseOutput);

AbstractHttp.prototype.setupProxy = function() {
  var tunnel = this.requireLib('tunnel');

  var proxyUrl = url.parse(this.proxy);
  var proxyType = proxyUrl.protocol ? proxyUrl.protocol.slice(0, -1) : 'http';

  // check if the auth part is base64 encoded.
  // if there is no colon, then the assumption is that it's base64.
  var auth = proxyUrl.auth;
  if (auth) {
    if (auth.indexOf(':') == -1) {
      auth = new Buffer(auth, 'base64').toString('ascii');
      // if after decoding there still isn't a colon, then revert back to the original value
      if (auth.indexOf(':') == -1) {
        auth = proxyUrl.auth;
      }
    }
    delete proxyUrl.auth;
  }

  if (this.ssl) {
    // create an https tunnel through the proxy.
    // Possible values are httpOverHttp, httpOverHttps, httpsOverHttp, httpsOverHttps
    var tunnelType = 'httpsOver' + proxyType.charAt(0).toUpperCase() + proxyType.slice(1);
    if (!tunnel[tunnelType]) {
      throw new Error('Proxy tunnel type '+ tunnelType + ' is not supported');
    }

    var tunnelingOptions = {
      maxSockets: http.globalAgent.maxSocket,
      proxy: {
        host: proxyUrl.hostname,
        port: proxyUrl.port,
        proxyAuth: auth
      },
    };

    // create the tunnel
    this.tunnelingAgent = tunnel[tunnelType](tunnelingOptions);

  } else {
    // use a standard forwarding proxy
    this.path_prefix = url.format({
      protocol: 'http' + (this.ssl ? 's' : '' ) + ':',
      hostname: this.host,
      port: this.port,
    });
    this.host = proxyUrl.hostname;
    this.port = proxyUrl.port;
    this.proxyAuth = auth;
  }

  logger.info('Using http proxy ' + url.format(proxyUrl));
}

AbstractHttp.prototype.abstractAfterLoadConfig = function(callback) {
  logger.info('Start HTTP output to' + this.to());

  this.error_buffer = error_buffer.create('output HTTP Post to ' + this.host, this.error_buffer_delay, this);

  if (this.proxy) {
    this.setupProxy();
  }

  callback();
}

AbstractHttp.prototype.process = function(data) {
  this.format_payload(data, function(http_options, body) {
    if (this.tunnelingAgent) {
      http_options.agent = this.tunnelingAgent;
    }
    if (this.proxyAuth) {
      http_options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(this.proxyAuth).toString('base64');
    }
    if (this.path_prefix) {
      http_options.path = this.path_prefix + http_options.path;
    }
    // tls options are not copied in old node version
    if (this.ssl && process.versions.node.split('.')[1] < 10) {
      http_options.agent = new https.Agent(http_options);
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

    if (this.ssl) {
      var req = https.request(this.merge_ssl_options(http_options), listener);
    }
    else {
      var req = http.request(http_options, listener);
    }

    req.on('error', function(e) {
      this.error_buffer.emit('error', e.message);
    }.bind(this));

    req.write(body);
    req.end();
  }.bind(this));
}

AbstractHttp.prototype.close = function(callback) {
  logger.info('Closing HTTP Post output to', this.host, this.port, 'ssl ' + this.ssl);
  callback();
}

exports.AbstractHttp = AbstractHttp;