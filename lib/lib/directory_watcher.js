var fs = require('fs'),
  path = require('path'),
  logger = require('log4node');

var current = {};

exports.register = function(dir, callback) {
  dir = path.resolve(dir);
  if (!current[dir]) {
    logger.info('Create watcher for dir', dir);
    current[dir] = fs.watch(dir);
    current[dir].setMaxListeners(0);
  }
  var local_callback = function(event, filename) {
    if (filename === null) {
      logger.warning('The event \'change\' of NodeJS fs.watch API does not return a filename. Please update NodeJS or use a compatible OS.');
      return;
    }
    callback(event, filename);
  };
  current[dir].on('change', local_callback);
  logger.info('Add watcher on dir', dir, 'listeners', current[dir].listeners('change').length);
  return {
    dir: dir,
    callback: local_callback,
  };
};

exports.unregister = function(id) {
  logger.info('Remove watcher on dir', id.dir);
  current[id.dir].removeListener('change', id.callback);
  if (current[id.dir].listeners('change').length === 0) {
    logger.info('Removing empty listener on', id.dir);
    current[id.dir].close();
    delete current[id.dir];
  }
};

exports.current = current;
