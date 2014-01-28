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

exports.computePath = function(data_type) {
  return '/logstash-' + formatDate() + '/' + data_type;
};
