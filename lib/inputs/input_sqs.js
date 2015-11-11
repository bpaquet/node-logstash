var base_input = require('../lib/base_input'),
  sqs_wrapper = require('../lib/sqs_wrapper'),
  util = require('util'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function InputSQS() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig(error_buffer.config(function() {
    return 'sqs from ' + this.aws_queue;
  }));
  this.mergeConfig(sqs_wrapper.config());
  this.mergeConfig({
    name: 'SQS',
    optional_params: ['polling_delay', 'type'],
    default_values: {
      polling_delay: '10'
    },
    start_hook: this.start,
  });
}

util.inherits(InputSQS, base_input.BaseInput);

InputSQS.prototype.start = function(callback) {
  this.polling_delay = parseInt(this.polling_delay, 10);
  this.closed_callback = undefined;
  logger.info('Creating AWS SQS Input from', this.aws_queue, 'polling delay', this.polling_delay);
  this.waitMessage();
  callback();
};

InputSQS.prototype.waitMessage = function() {
  this.sqs.receiveMessage({
    QueueUrl: this.queue_url,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: this.polling_delay,
  }, function(err, result) {
    if (err) {
      this.error_buffer.emit('error', err);
    }
    else {
      if (result.Messages) {
        var ack = {
          QueueUrl: this.queue_url,
          Entries: [],
        };
        result.Messages.forEach(function(mm) {
          this.unserialize_data(mm.Body, function(parsed) {
            this.emit('data', parsed);
          }.bind(this), function(data) {
            this.emit('data', {
              'message': data.trim(),
              'sqs_queue': this.aws_queue,
              'type': this.type,
            });
          }.bind(this));
          ack.Entries.push({
            Id: mm.MessageId,
            ReceiptHandle: mm.ReceiptHandle,
          });
        }.bind(this));
        this.sqs.deleteMessageBatch(ack, function(err, result) {
          if (err) {
            this.error_buffer.emit('error', err);
          }
          else {
            if (result.Successful.length !== ack.Entries.length) {
              this.error_buffer.emit('error', new Error('Wrong SQS DeleteBatchMessage Response'));
            }
          }
        }.bind(this));
      }
    }
    if (this.closed_callback) {
      this.closed_callback();
    }
    else {
      this.waitMessage();
    }
  }.bind(this));
};

InputSQS.prototype.close = function(callback) {
  logger.info('Closing AWS SQS Input from', this.aws_queue, 'waiting end of polling');
  this.closed_callback = function() {
    logger.info('Closed AWS SQS Input from', this.aws_queue);
    callback();
  };
};

exports.create = function() {
  return new InputSQS();
};
