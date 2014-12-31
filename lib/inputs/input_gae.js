var base_input = require('../lib/base_input'),
  http = require('http'),
  https = require('https'),
  util = require('util'),
  url = require('url'),
  logger = require('log4node');

function InputGae() {
  base_input.BaseInput.call(this);
  this.mergeConfig({
    name: 'Gae',
    host_field: 'host',
    port_field: 'port',
    required_params: ['key'],
    optional_params: ['ssl', 'polling', 'servlet_name', 'access_logs_type', 'access_logs_field_name', 'type'],
    default_values: {
      'ssl': false,
      'polling': 60,
      'servlet_name': 'logs',
    },
    start_hook: this.start,
  });
}

util.inherits(InputGae, base_input.BaseInput);

InputGae.prototype.start = function(callback) {
  this.proto = this.ssl ? https : http;
  this.base_url = (this.ssl ? 'https' : 'http') + '://' + this.host + ':' + this.port + '/' + this.servlet_name;
  this.current_timestamp = (new Date()).getTime();
  logger.info('Start polling log from Google App Engine to', this.base_url, 'polling period', this.polling);
  this.interval = setInterval(function() {
    this.poll();
  }.bind(this), this.polling * 1000);
  this.poll();
  callback();
};

InputGae.prototype.poll = function() {
  if (this.in_progress) {
    return;
  }
  this.in_progress = true;
  var options = url.parse(this.base_url + '?start_timestamp=' + this.current_timestamp + '&log_key=' + this.key);
  options.rejectUnauthorized = false;
  var req = this.proto.get(options, function(res) {
    if (res.statusCode === 200) {
      var current_buffer = '';
      res.on('data', function(l) {
        current_buffer += l.toString();
        var lines = current_buffer.split('\n');
        current_buffer = lines.pop();
        lines.forEach(function(l) {
          try {
            if (l !== '') {
              var o = JSON.parse(l);
              if (this.access_logs_type && this.access_logs_field_name && o[this.access_logs_field_name]) {
                o.type = this.access_logs_type;
              }
              if (this.type && !o.type) {
                o.type = this.type;
              }
              this.emit('data', o);
            }
          }
          catch(e) {
            this.emit('error', e);
          }
        }.bind(this));
      }.bind(this));
      this.current_timestamp = res.headers['x-log-end-timestamp'];
      res.on('end', function() {
        this.in_progress = false;
      }.bind(this));
    }
    else {
      this.emit('error', new Error('Google app engine return wrong return code ' + res.statusCode));
      this.in_progress = false;
    }
  }.bind(this));

  req.on('error', function(err) {
    this.emit('error', err);
    this.in_progress = false;
  }.bind(this));
};

InputGae.prototype.close = function(callback) {
  clearInterval(this.interval);
  logger.info('Closing Google App Engine poller to ', this.host + ':' + this.port);
  callback();
};

exports.create = function() {
  return new InputGae();
};
