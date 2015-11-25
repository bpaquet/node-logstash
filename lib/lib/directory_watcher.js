var fs = require('fs'),
  path = require('path'),
  os = require('os'),
  logger = require('log4node');

var platform = os.platform();

var current = {};

exports.register = function(dir, callback) {
  dir = path.resolve(dir);
  if (!current[dir]) {
    logger.info('Create watcher for dir', dir);
    if (platform === 'darwin') {
      var fsevents = require('fsevents');
      current[dir] = fsevents(dir);
      current[dir].start();
      current[dir].exists = {};
      fs.readdir(dir, function(err, l) {
        if (!err) {
          l.forEach(function(x) {
            current[dir].exists[x] = true;
          });
        }
      });
    }
    else {
      current[dir] = fs.watch(dir);
    }
    current[dir].setMaxListeners(0);
  }
  var local_callback = (platform === 'darwin') ? function(filename, event) {
    filename = path.basename(filename);
    if (event.event === 'moved-out' || event.event === 'deleted') {
      if (!current[dir].exists[filename]) {
        current[dir].exists[filename] = true;
      }
      callback('rename', filename);
    }
    else if (event.event === 'moved-in') {
      if (current[dir].exists[filename]) {
        delete current[dir].exists[filename];
        callback('rename', filename);
      }
      else {
        callback('change', filename);
      }
    }
    else if (event.event === 'modified') {
      if (!current[dir].exists[filename]) {
        current[dir].exists[filename] = true;
        callback('rename', filename);
      }
      callback('change', filename);
    }
    else {
      logger.warning('Ignored event', event);
    }
  } : function(event, filename) {
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
    if (platform === 'darwin') {
      current[id.dir].stop();
    }
    else {
      current[id.dir].close();
    }
    delete current[id.dir];
  }
};

exports.current = current;
