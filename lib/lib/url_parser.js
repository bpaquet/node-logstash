var querystring = require('querystring');

exports.extractProtocol = function(url) {
  var index = url.indexOf('://');
  return index == -1 ? undefined : {protocol: url.substring(0, index), next: url.substring(index + 3)};
}

exports.processUrlContent = function(url) {
  if (url.length == 0) {
    return undefined;
  }
  var index = url.indexOf('?');
  var host = index == -1 ? url : url.substring(0, index);
  host = querystring.parse('a=' + host)['a'];
  var params = index == -1 ? {} : querystring.parse(url.substring(index + 1).replace(/\+/g, '%2B'));
  return {host: host, params: params};
}

exports.extractPortNumber = function(host) {
  var index = host.indexOf(':');
  if (index == -1) {
    return undefined;
  }
  else {
    var port = parseInt(host.substring(index + 1));
    return isNaN(port) ? undefined : {host : host.substring(0, index), port: port};
  }
}
