
var amqp = require('amqplib/callback_api'),
  ssl_helper = require('../lib/ssl_helper');

exports.createAmqpClient = function(options) {
  var current_connection;
  var connect_timeout;
  var channel;
  var closing = false;

  var connect = function() {
    connect_timeout = undefined;
    options.amqp_logger.info('Try connecting to', options.amqp_url, 'retry delay', options.retry_delay);
    amqp.connect(options.amqp_url + '?heartbeat=' + options.heartbeat, ssl_helper.merge_options(options, {}), function(err, conn) {
      if (err) {
        options.amqp_logger.error('Unable to connect', err);
        connect_timeout = setTimeout(connect, options.retry_delay);
        return;
      }
      if (closing) {
        return;
      }
      options.amqp_logger.info('Connected to', options.amqp_url);
      current_connection = conn;

      conn.on('error', function(err) {
        options.amqp_logger.info('AMQP Error', err);
        if (err.stack) {
          options.amqp_logger.info(err.stack);
        }
      });
      conn.on('close', function() {
        options.disconnected_callback(channel);
        current_connection = undefined;
        channel = undefined;
        options.amqp_logger.info('AMQP Close');
        if (!closing) {
          setTimeout(connect, options.retry_delay);
        }
      });

      channel = current_connection.createChannel(function(err, c) {
        if (err) {
          options.amqp_logger.error('Unable to create channel', err);
        }
        else {
          channel = c;
          options.connected_callback(channel);
        }
      });
    });
  };

  connect();

  return {
    close: function(callback) {
      closing = true;
      options.amqp_logger.info('Closing AMQP connection to', options.amqp_url);
      if (connect_timeout) {
        clearTimeout(connect_timeout);
      }
      if (current_connection) {
        current_connection.close(function(err) {
          process.nextTick(function() {
            callback(err);
          });
        });
      }
      else {
        callback();
      }
    }
  };

};