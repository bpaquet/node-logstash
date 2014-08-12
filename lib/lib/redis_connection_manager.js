var redis = require('redis'),
  util = require('util'),
  events = require('events'),
  logger = require('log4node');

function RedisConnectionManager(host, port, auth_pass) {
  events.EventEmitter.call(this);
  this.host = host;
  this.port = port;
  this.options = {};
  if (auth_pass) {
    this.options.auth_pass = auth_pass;
  }

  logger.info('Connecting to Redis', this.host + ':' + this.port);

  this.client = redis.createClient(this.port, this.host, this.options);
  this.end_callback = function() {
    logger.info('Redis connection lost to ' + this.host + ':' + this.port);
  }.bind(this);

  this.client.on('end', function() {
    this.end_callback();
  }.bind(this));

  this.client.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.client.on('connect', function() {
    logger.info('Connected to Redis', this.host + ':' + this.port);
    this.emit('connect', this.client);
  }.bind(this));
}

util.inherits(RedisConnectionManager, events.EventEmitter);

RedisConnectionManager.prototype.quit = function(callback) {
  logger.info('Closing connection to Redis', this.host + ':' + this.port);
  this.emit('before_quit', this.client);
  this.end_callback = callback;
  this.client.quit();
  delete this.client;
};

exports.create = function(host, port, retry) {
  return new RedisConnectionManager(host, port, retry);
};
