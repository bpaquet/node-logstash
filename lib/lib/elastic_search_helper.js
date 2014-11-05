function fill0(s, k) {
  return s.length === k ? s : '0' + fill0(s, k - 1);
}

function formatDate() {
  var now = new Date();
  var year = now.getUTCFullYear();
  var month = fill0((now.getUTCMonth() + 1) + '', 2);
  var day = fill0((now.getUTCDate()) + '', 2);
  return year + '.' + month + '.' + day;
}

// update the date string every minute to save on CPU
var _date = formatDate();
setInterval(function() {
  _date = formatDate();
}, 60 * 1000);

exports.computePath = function(index_type, data_type) {
  return '/' + index_type + '-' + _date + '/' + data_type;
};

exports.buildBulkPayload = function(data) {
  var indexLine = '{"index": {}}\n';
  var payload = '';
  data.forEach(function(d) {
    payload = payload + indexLine + d + '\n';
  });
  return payload;
};
