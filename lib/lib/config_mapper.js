var querystring = require('querystring');

function compute_url(type, o, callback) {
  var keys = Object.keys(o);
  if (keys.length !== 1) {
    throw new Error('Unable to parse');
  }
  var plugin = keys[0];
  var url = type + '://' + plugin + '://';
  callback(plugin, o[plugin], url);
}

function stringify(plugin_conf) {
  Object.keys(plugin_conf).forEach(function(key) {
    if (typeof(plugin_conf[key]) === 'object' && ! Array.isArray(plugin_conf[key])) {
      var s = [];
      Object.keys(plugin_conf[key]).forEach(function(k) {
        s.push(k + ':' + plugin_conf[key][k]);
      });
      plugin_conf[key] = s.join(',');
    }
  });
  return querystring.stringify(plugin_conf);
}

exports.map = function(x) {
  var res = [];
  ['input', 'filter', 'output'].forEach(function(type) {
    (x[type] || []).forEach(function(z) {
      compute_url(type, z, function(plugin_name, plugin_conf, url) {
        if (plugin_name === '__if__') {
          var cond_stack = [];
          plugin_conf.ifs.forEach(function(x) {
            var dynamic_eval = {
              false_clauses: cond_stack,
              true_clause: x.cond
            };
            x.then.forEach(function(z) {
              compute_url(type, z, function(plugin_name, plugin_conf, url) {
                plugin_conf.__dynamic_eval__ = JSON.stringify(dynamic_eval);
                url += '?' + stringify(plugin_conf);
                res.push(url);
              });
            });
            cond_stack.push(x.cond);
          });
          if (plugin_conf.else) {
            var dynamic_eval = {
              false_clauses: cond_stack,
            };
            plugin_conf.else.forEach(function(z) {
              compute_url(type, z, function(plugin_name, plugin_conf, url) {
                plugin_conf.__dynamic_eval__ = JSON.stringify(dynamic_eval);
                url += '?' + stringify(plugin_conf);
                res.push(url);
              });
            });
          }
        }
        else {
          if (Object.keys(plugin_conf).length > 0) {
            url += '?' + stringify(plugin_conf);
          }
          res.push(url);
        }
      });
    });
  });
  return res;
};