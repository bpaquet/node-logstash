var AWS = require('aws-sdk'),
  url = require('url');

exports.config = function() {
  return {
    host_field: 'aws_queue',
    required_params: ['aws_access_key_id', 'aws_secret_access_key'],
    default_values: {
    },
    start_hook: function(callback) {
      var parsed = url.parse('http://' + this.aws_queue);
      this.sqs = new AWS.SQS({
        accessKeyId: this.aws_access_key_id,
        secretAccessKey: this.aws_secret_access_key,
        region: parsed.host.split('.')[1],
        apiVersion: '2012-11-05',
      });
      this.queue_url = 'https://' + this.aws_queue;
      callback();
    },
  };
};
