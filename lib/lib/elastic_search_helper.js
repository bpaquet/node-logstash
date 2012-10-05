
function fill0(s, k) {
  return s.length == k ? s : '0' + fill0(s, k -1);
}

function formatDate() {
  var now = new Date();
  var year = now.getFullYear();
  var month = fill0((now.getMonth() + 1) + '', 2);
  var day = fill0((now.getDate()) + '', 2);
  return year + '.' + month + '.' + day;
}

exports.computePath = function(data_type) {
  return '/logstash-' + formatDate() + '/' + data_type;
}
