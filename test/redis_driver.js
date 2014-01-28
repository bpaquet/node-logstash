var spawn = require('child_process').spawn,
  logger = require('log4node');

function RedisDriver() {}

RedisDriver.prototype.start = function(options, callback) {
  logger.info('Starting redis', options);
  this.redis = spawn('redis-server', ['-']);
  // this.redis.stdout.pipe(process.stdout);
  Object.keys(options).forEach(function(key) {
    this.redis.stdin.write(key + ' ' + options[key] + '\r\n');
  }.bind(this));
  this.redis.stdin.end();
  setTimeout(callback, 200);
};

RedisDriver.prototype.stop = function(callback) {
  if (this.redis) {
    this.redis.once('exit', function() {
      logger.info('Redis stopped');
      callback();
    });
    this.redis.kill('SIGINT');
    delete this.redis;
  }
};

exports.RedisDriver = RedisDriver;
