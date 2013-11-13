var abstract_http = require('./abstract_http'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    url = require('url'),
    fs = require('fs'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

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

OutputHttpPost.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(function() {
    if (this.proxy) {
      var tunnel = require('tunnel');

      var proxyUrl = url.parse(this.proxy);
      var proxyType = proxyUrl.protocol ? proxyUrl.protocol.slice(0,-1) : 'http';
      var serverType = this.proto;

      // create the correct type of tunnel.
      // Possible values are httpOverHttp, httpOverHttps, httpsOverHttp, httpsOverHttps
      var tunnelType = serverType+'Over'+proxyType.charAt(0).toUpperCase()+proxyType.slice(1);
      if (!tunnel[tunnelType]) {
        throw new Error('Proxy tunnel type '+ tunnelType + ' is not supported');
      }

      this.tunnelingAgent = tunnel[tunnelType]({
        maxSockets: http.globalAgent.maxSocket,
        proxy: {
          host: proxyUrl.hostname,
          port: proxyUrl.port,
          proxyAuth: proxyUrl.auth
        }
      });
      delete proxyUrl.auth;
      logger.info('Using ' + tunnelType + ' proxy ' + url.format(proxyUrl));
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
    var line = this.serialize_data(data);
    if (line) {
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
