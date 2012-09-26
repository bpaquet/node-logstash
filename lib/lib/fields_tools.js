
function replace(data, s, error_cb) {
  var result = s.match(/^(.*)#{([^\\}]+)}(.*)$/);
  if (result) {
    var key = result[2];
    var replaced = undefined;
    if (data[key]) {
      replaced = data[key];
    }
    if (!replaced && data['@fields'] && data['@fields'][key]) {
      replaced = data['@fields'][key];
    }
    if (!replaced) {
      error_cb(new Error('Unable to find field: ' + key));
      replaced = '';
    }
    return replace(data, result[1] + replaced + result[3]);
  }
  return s;
}

exports.replace = replace;
