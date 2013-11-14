var abstract_udp = require('./abstract_udp'),
    util = require('util'),
    logger = require('log4node'),
    zlib = require('zlib');

function OutputGelf() {
  abstract_udp.AbstractUdp.call(this);
  this.config.name = 'Gelf';
  this.config.optional_params.push('version');
  this.config.optional_params.push('message');
  this.config.optional_params.push('facility');
  this.config.optional_params.push('level');
  this.config.default_values['version'] = '1.0';
  this.config.default_values['message'] = '#{message}';
  this.config.default_values['facility'] = '#{type}';
  this.config.default_values['level'] = '6';
}

util.inherits(OutputGelf, abstract_udp.AbstractUdp);

OutputGelf.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(callback);
}

OutputGelf.prototype.format_payload = function(data, callback) {
   var m = {
    version: this.version,
    short_message: this.replaceByFields(data, this.message),
    facility: this.replaceByFields(data, this.facility) || 'no_facility',
    level: this.replaceByFields(data, this.level),
    host: data['host'],
    timestamp: (new Date(data['@timestamp'])).getTime() / 1000,
  };
  for (key in data) {
    if (!key.match(/^@/) && key != 'message' && key != 'host') {
      m["_" + key] = data[key];
    }
  }
  if (!m.short_message) {
    return;
  }
  logger.debug('Sending GELF', m);
  zlib.deflate(new Buffer(JSON.stringify(m)), function(err, message) {
    if (err) {
      return this.emit('error', new Error('Error while compressing data:' + err));
    }
    callback(message);
  }.bind(this));
}

OutputGelf.prototype.to = function() {
  return ' Gelf ' + this.host + ':' + this.port;
}

exports.create = function() {
  return new OutputGelf();
}
