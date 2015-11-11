var base_output = require('../lib/base_output'),
  sqs_wrapper = require('../lib/sqs_wrapper'),
  util = require('util'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function OutputSqs() {
  base_output.BaseOutput.call(this);
  this.mergeConfig(this.serializer_config('json_logstash'));
  this.mergeConfig(error_buffer.config(function() {
    return 'sqs to ' + this.aws_queue;
  }));
  this.mergeConfig(sqs_wrapper.config());
  this.mergeConfig({
    name: 'SQS',
    start_hook: this.start,
  });
}

util.inherits(OutputSqs, base_output.BaseOutput);

OutputSqs.prototype.start = function(callback) {
  logger.info('Creating AWS SQS Output to', this.aws_queue);
  callback();
};

OutputSqs.prototype.process = function(data) {
  this.sqs.sendMessage({
    QueueUrl: this.queue_url,
    MessageBody: this.serialize_data(data)
  }, function (err, result) {
    if (err) {
      this.error_buffer.emit('error', err);
    }
    else {
      if (!result.MessageId) {
        this.error_buffer.emit('error', new Error('Wrong SQS SendMessage result'));
      }
    }
  }.bind(this));
};

OutputSqs.prototype.close = function(callback) {
  logger.info('Closing AWS SQS Output to', this.aws_queue);
  callback();
};

exports.create = function() {
  return new OutputSqs();
};
