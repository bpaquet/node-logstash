var events = require('events');

var sig_listener = new events.EventEmitter();
sig_listener.setMaxListeners(0);

process.on('SIGUSR2', function() {
  sig_listener.emit('SIGUSR2');
});

process.on('SIGUSR1', function() {
  sig_listener.emit('SIGUSR1');
});

exports.sig_listener = sig_listener;
