var base_input = require('../lib/base_input'),
  sqs_wrapper = require('../lib/sqs_wrapper'),
  util = require('util'),
  logger = require('log4node'),
  error_buffer = require('../lib/error_buffer');

function InputSQS() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig(error_buffer.config(function() {
    return 'sqs from ' + this.aws_host;
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
  logger.info('Creating AWS SQS Input from', this.aws_host, 'polling delay', this.polling_delay);
  this.waitMessage();
  callback();
};

InputSQS.prototype.waitMessage = function() {
  this.aws_client.call('ReceiveMessage', {
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: this.polling_delay,
  }, function(err, result) {
    if (err) {
      this.error_buffer.emit('error', err);
    }
    else {
      if (result.Error) {
        this.error_buffer.emit('error', new Error(result.Error.Code));
      }
      else {
        if (result.ReceiveMessageResult && result.ReceiveMessageResult.Message) {
          var m = result.ReceiveMessageResult.Message;
          if (! Array.isArray(m)) {
            m = [m];
          }
          var acks = {};
          var index = 1;
          m.forEach(function(mm) {
            this.unserialize_data(mm.Body, function(parsed) {
              this.emit('data', parsed);
            }.bind(this), function(data) {
              this.emit('data', {
                'message': data.trim(),
                'sqs_queue': this.aws_host,
                'type': this.type,
              });
            }.bind(this));
            acks['DeleteMessageBatchRequestEntry.' + index + '.Id'] = index;
            acks['DeleteMessageBatchRequestEntry.' + index + '.ReceiptHandle'] = mm.ReceiptHandle;
            index += 1;
          }.bind(this));
          this.aws_client.call('DeleteMessageBatch', acks, function(err, result) {
            if (err) {
              this.error_buffer.emit('error', err);
            }
            else {
              if (!result.DeleteMessageBatchResult || !result.DeleteMessageBatchResult.DeleteMessageBatchResultEntry) {
                this.error_buffer.emit('error', new Error('Wrong SQS DeleteBatchMessage Response'));
              }
            }
          }.bind(this));
        }
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
  logger.info('Closing AWS SQS Input from', this.aws_host, 'waiting end of polling');
  this.closed_callback = function() {
    logger.info('Closed AWS SQS Input from', this.aws_host);
    callback();
  };
};

exports.create = function() {
  return new InputSQS();
};
