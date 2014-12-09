var abstract_http = require('./abstract_http'),
  util = require('util');

function OutputHttpPost() {
  abstract_http.AbstractHttp.call(this);
  this.mergeConfig(this.serializer_config('raw'));
  this.mergeConfig({
    name: 'Http Post',
    optional_params: ['path'],
    default_values: {
      'path': '/',
    },
  });
}

util.inherits(OutputHttpPost, abstract_http.AbstractHttp);

OutputHttpPost.prototype.process = function(data) {
  var path = this.replaceByFields(data, this.path);
  if (path) {
    var http_options = {
      host: this.host,
      port: this.port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': this.serializer === 'json_logstash' ? 'application/json' : 'text/plain'
      }
    };
    var line = this.serialize_data(data);
    if (line) {
      http_options.headers['Content-Length'] = Buffer.byteLength(line, 'utf-8');
      this.sendHttpRequest(http_options, line);
    }
  }
};

OutputHttpPost.prototype.to = function() {
  return ' http ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputHttpPost();
};
