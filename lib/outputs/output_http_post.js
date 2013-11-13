var abstract_http = require('./abstract_http'),
    util = require('util');

function OutputHttpPost() {
  abstract_http.AbstractHttp.call(this);
  this.config.name = 'Http Post';
  this.config.required_params.push('path');
  this.config.optional_params.push('format');
  this.config.optional_params.push('serializer');
  this.config.default_values['format'] = '#{message}';
  this.config.default_values['serializer'] = 'raw';
}

util.inherits(OutputHttpPost, abstract_http.AbstractHttp);

OutputHttpPost.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(function() {
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
      headers: {'Content-Type': this.output_type == 'json' ? 'application/json' : 'text/plain'},
    };
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
