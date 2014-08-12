var argv = require('optimist').argv,
  log = require('log4node').reconfigure({
    file: argv.file,
    prefix: 'a '
  });

console.log('Starting loop, count', argv.count, 'period', argv.period);

var count = 0;

function toto() {
  if (count >= argv.count) {
    console.log('Bye.');
    clearInterval(toto);
    process.exit(0);
    return;
  }
  log.info('Line ' + count);
  count++;
}

setInterval(toto, parseInt(argv.period, 10));
