var abstract_http = require('./abstract_http'),
    util = require('util');

function OutputHttpPost() {
  abstract_http.AbstractHttp.call(this);
  this.merge_config({
    name: 'Http Post',
    optional_params: ['path'],
    default_values : {
      'path': '/',
    },
  });
  this.merge_config(this.serializer_config('raw'));
}

util.inherits(OutputHttpPost, abstract_http.AbstractHttp);

OutputHttpPost.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(callback);
};

OutputHttpPost.prototype.format_payload = function(data, callback) {
  var path = this.replaceByFields(data, this.path);
  if(path) {
    var http_options = {
      host: this.host,
      port: this.port,
      path: path,
      method: 'POST',
      headers: {'Content-Type': this.output_type === 'json' ? 'application/json' : 'text/plain'}
    };
    var line = this.serialize_data(data);
    if (line) {
      http_options.headers['Content-Length'] = line.length;
      callback(http_options, line);
    }
  }
};

OutputHttpPost.prototype.to = function() {
  return ' http ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputHttpPost();
};
