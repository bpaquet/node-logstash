var base_input = require('../lib/base_input'),
  amqp_driver = require('../lib/amqp_driver'),
  util = require('util'),
  logger = require('log4node');

function InputAmqp() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'Ampq',
    host_field: 'host',
    port_field: 'port',
    required_params: ['exchange_name'],
    optional_params: ['topic', 'durable', 'retry_delay', 'heartbeat', 'type'],
    default_values: {
      'durable': true,
      'retry_delay': 3000,
      'heartbeat': 10,
    },
    start_hook: this.start,
  });
}

util.inherits(InputAmqp, base_input.BaseInput);

InputAmqp.prototype.start = function(callback) {
  logger.info('Start AMQP listener to', this.host + ':' + this.port, 'exchange', this.exchange_name, 'topic', this.topic);

  var options = {
    url: 'amqp://' + this.host + ':' + this.port,
    connected_callback: function(channel) {
      channel.assertExchange(this.exchange_name, this.topic ? 'topic' : 'fanout', {durable: this.durable}, function(err) {
        if (err) {
          logger.error('Unable to create exchange', err);
        }
        else {
          channel.assertQueue('', {exclusive: true}, function(err, queue) {
            if (err) {
              logger.error('Unable to assert locale queue', err);
            }
            else {
              channel.bindQueue(queue.queue, this.exchange_name, this.topic || '', {}, function(err) {
                if (err) {
                  logger.error('Unable to bind queue', err);
                }
                else {
                  logger.info('Binded to', this.exchange_name, 'topic', this.topic);
                  channel.consume(queue.queue, function(m) {
                    var data = m.content.toString();
                    this.unserialize_data(data, function(parsed) {
                      if (this.type) {
                        parsed.type = this.type;
                      }
                      this.emit('data', parsed);
                    }.bind(this), function(data) {
                      this.emit('error', 'Unable to parse data ' + data);
                    }.bind(this));
                  }.bind(this), {noAck: true});
                }
              }.bind(this));
            }
          }.bind(this));
        }
      }.bind(this));
    }.bind(this),
    disconnected_callback: function() {
    },
    heartbeat: this.heartbeat,
    retry_delay: this.retry_delay,
    logger: logger,
  };

  this.driver = amqp_driver.create_amqp_client(options);

  callback();
};

InputAmqp.prototype.close = function(callback) {
  logger.info('Closing AMQP input tcp', this.host + ':' + this.port + ' exchange ' + this.exchange_name);
  this.driver.close(callback);
};

exports.create = function() {
  return new InputAmqp();
};
