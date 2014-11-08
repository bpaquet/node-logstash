
var amqp = require('amqplib/callback_api');

exports.create_amqp_client = function(options) {
  var current_connection;
  var connect_timeout;
  var channel;
  var closing = false;

  var connect = function() {
    connect_timeout = undefined;
    options.logger.info('Try connecting to', options.url, 'retry delay', options.retry_delay);
    amqp.connect(options.url + '?heartbeat=' + options.heartbeat, {}, function(err, conn) {
      if (err) {
        options.logger.error('Unable to connect');
        connect_timeout = setTimeout(connect, options.retry_delay);
        return;
      }
      if (closing) {
        return;
      }
      options.logger.info('Connected to', options.url);
      current_connection = conn;

      conn.on('error', function(err) {
        options.logger.info('AMQP Error', err);
        if (err.stack) {
          options.logger.info(err.stack);
        }
      });
      conn.on('close', function() {
        options.disconnected_callback(channel);
        current_connection = undefined;
        channel = undefined;
        options.logger.info('AMQP Close');
        if (!closing) {
          setTimeout(connect, options.retry_delay);
        }
      });

      channel = current_connection.createChannel(function(err, c) {
        if (err) {
          options.logger.error('Unable to create channel', err);
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
      options.logger.info('Closing connection');
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