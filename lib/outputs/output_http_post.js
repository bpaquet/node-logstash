var abstract_http = require('./abstract_http'),
    util = require('util');

function OutputHttpPost() {
  abstract_http.AbstractHttp.call(this);
  this.config.name = 'Http Post';
  this.config.optional_params.push('path');
  this.config.optional_params.push('format');
  this.config.optional_params.push('serializer');
  this.config.optional_params.push('proxy');
  this.config.default_values['path'] = '/';
  this.config.default_values['format'] = '#{message}';
  this.config.default_values['serializer'] = 'raw';
}

util.inherits(OutputHttpPost, abstract_http.AbstractHttp);

OutputHttpPost.prototype.setupProxy = function() {
  var tunnel = require('tunnel');

  var proxyUrl = url.parse(this.proxy);
  var proxyType = proxyUrl.protocol ? proxyUrl.protocol.slice(0,-1) : 'http';
  var serverType = this.proto;

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

  if (serverType == 'https') {
    // create an https tunnel through the proxy.
    // Possible values are httpOverHttp, httpOverHttps, httpsOverHttp, httpsOverHttps
    var tunnelType = serverType+'Over'+proxyType.charAt(0).toUpperCase()+proxyType.slice(1);
    if (!tunnel[tunnelType]) {
      throw new Error('Proxy tunnel type '+ tunnelType + ' is not supported');
    }

    var tunnelingOptions = {
      maxSockets: http.globalAgent.maxSocket,
      proxy: {
        host: proxyUrl.hostname,
        port: proxyUrl.port,
        proxyAuth: auth
      }
    };

    // create the tunnel
    this.tunnelingAgent = tunnel[tunnelType](tunnelingOptions);

  } else {
    // use a standard forwarding proxy
    this.path = url.format({protocol: this.proto+':', hostname: this.host, port: this.port});
    this.host = proxyUrl.hostname;
    this.port = proxyUrl.port;
    this.proxyAuth = auth;
  }

  logger.info('Using http proxy ' + url.format(proxyUrl));
}

OutputHttpPost.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(function() {
    if (this.proxy) {
      this.setupProxy();
    }
    this.configure_serialize(this.serializer, this.format);
    callback();
  }.bind(this));
}

OutputHttpPost.prototype.format_payload = function(data, callback) {
  var path = this.replaceByFields(data, this.path);
  if(path) {
    var http_options = {
      host: this.host,
      port: this.port,
      path: path,
      method: 'POST',
      headers: {'Content-Type': this.output_type == 'json' ? 'application/json' : 'text/plain'}
    };
    if (this.tunnelingAgent) {
      http_options.agent = this.tunnelingAgent;
    }
    if (this.proxyAuth) {
      http_options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(this.proxyAuth).toString('base64');
    }
    var line = this.serialize_data(data);
    if (line) {
      http_options.headers['Content-Length'] = line.length;
      callback(http_options, line);
    }
  }
}

OutputHttpPost.prototype.to = function() {
  return ' http ' + this.host + ':' + this.port;
}

exports.create = function() {
  return new OutputHttpPost();
}
