var events = require('events'),
    log = require('log4node'),
    zmq = require('zmq');

var target = process.argv[2];
var type = process.argv[3];
var period = process.argv[4];
var count = process.argv[5];
var max = process.argv[6];

if (!target || !type || !period || !count) {
  process.exit(1);
}

log.info('Target', target, 'period', period, 'count', count);

var k = 0;
var e = new events.EventEmitter();

e.on('msg', function() {
  k ++;
  if (k % 10000 == 0) {
    log.info('Send', k);
  }
});

var kk = 0;

var socket = zmq.socket('push');
socket.connect(target);

setInterval(function() {
  kk ++;
  for(var i = 0; i < count; i ++) {
    socket.send(JSON.stringify({'@type': type, '@timestamp': (new Date()).toISOString(), '@message': 'message ' + kk + ' ' + i}));
    e.emit('msg');
  }
  if (max == kk) {
    process.exit(0);
  }
}, period);
