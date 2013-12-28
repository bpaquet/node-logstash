var fs = require('fs'),
  logger = require('log4node');

var current = {};

exports.register = function(dir, callback) {
  if (!current[dir]) {
    logger.info('Create watcher for dir', dir);
    current[dir] = fs.watch(dir);
    current[dir].setMaxListeners(0);
  }
  current[dir].on('change', callback);
  logger.info('Add watcher on dir', dir, 'listeners', current[dir].listeners('change').length);
  return {dir: dir, callback: callback};
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