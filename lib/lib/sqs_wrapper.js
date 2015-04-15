var aws = require('aws-lib'),
  url = require('url');

exports.config = function() {
  return {
    host_field: 'aws_host',
    required_params: ['aws_access_key_id', 'aws_secret_access_key'],
    default_values: {
    },
    start_hook: function(callback) {
      var parsed = url.parse('http://' + this.aws_host);
      this.aws_client = aws.createSQSClient(this.aws_access_key_id, this.aws_secret_access_key, {
        host: parsed.host,
        path: parsed.path,
        version: '2012-11-05',
      });
      callback();
    },
  };
};
