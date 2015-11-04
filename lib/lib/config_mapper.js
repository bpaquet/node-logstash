var querystring = require('querystring');

exports.map = function(x) {
  var res = [];
  ['input', 'filter', 'output'].forEach(function(type) {
    (x[type] || []).forEach(function(z) {
      var keys = Object.keys(z);
      if (keys.length !== 1) {
        throw new Error('Unable to parse ' + JSON.stringify(x));
      }
      var plugin = keys[0];
      var url = type + '://' + plugin + '://';
      if (Object.keys(z[plugin]).length > 0) {
        url += '?' + querystring.stringify(z[plugin]);
      }
      res.push(url);
    });
  });
  return res;
};