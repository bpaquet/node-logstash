var events = require('events'),
    util = require('util'),
    http = require('http'),
    logger = require('log4node'),
    url_parser = require('../lib/url_parser');

function OutputElasticSearch() {
  events.EventEmitter.call(this);
}

util.inherits(OutputElasticSearch, events.EventEmitter);

function fill0(s, k) {
  return s.length == k ? s : '0' + fill0(s, k -1);
}

function formatDate() {
  var now = new Date();
  var year = now.getFullYear();
  var month = fill0((now.getMonth() + 1) + '', 2);
  var day = fill0((now.getDate()) + '', 2);
  return year + '.' + month + '.' + day;
}

OutputElasticSearch.prototype.computePath = function() {
  return '/logstash-' + formatDate() + '/' + (this.config.params.type || 'data');
}

OutputElasticSearch.prototype.init = function(url) {
  this.config = url_parser.processUrlContent(url);

  if (!this.config) {
    return this.emit('init_error', 'Unable to parse config : ' + url);
  }

  this.host = url_parser.extractPortNumber(this.config.host);

  if (!this.host) {
    return this.emit('init_error', 'Unable to parse host : ' + this.config.host);
  }

  logger.info('Start ElasticSearch output to ' + this.host.host + ':' + this.host.port);

  this.on('data', function(data) {
    var params = {
      host: this.host.host,
      port: this.host.port,
      method: 'POST',
      path: this.computePath(),
    };

    var json = JSON.stringify(data);

    var req = http.request(params, function(res) {
      if (res.statusCode != 201) {
        this.emit('error', new Error('Wrong ElasticSearch return code ' + res.statusCode + ', should be 201. Data: ' + json));
      }
    }.bind(this));

    req.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));

    req.end(json);

  }.bind(this));

  this.emit('init_ok');
}

OutputElasticSearch.prototype.close = function() {
  logger.info('Closing ElasticSearch output to ' + this.host.host + ':' + this.host.port);
}

module.exports = {
  create: function() {
    return new OutputElasticSearch();
  }
}
