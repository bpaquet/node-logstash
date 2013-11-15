var base_filter = require('../lib/base_filter'),
    util = require('util'),
    dns = require('dns'),
    logger = require('log4node');

function FilterReverseDns() {
  base_filter.BaseFilter.call(this);
  this.merge_config({
    name: 'ReverseDns',
    optional_params: ['only_hostname'],
    default_values: {
      'only_hostname': 'true',
    }
  });
}

util.inherits(FilterReverseDns, base_filter.BaseFilter);

FilterReverseDns.prototype.afterLoadConfig = function(callback) {
  this.only_hostname = this.only_hostname == 'true';
  logger.info('Initialized reverse dns filter, use only hostname ', this.only_hostname);
  callback();
}

FilterReverseDns.prototype.process = function(data) {
  if (data['host']) {
    try {
      dns.reverse(data['host'], function(err, result) {
        if (!err) {
          data['host'] = result[0];
          if (this.only_hostname) {
            data['host'] = data['host'].split('.')[0];
          }
        }
        this.emit('output', data);
      }.bind(this));
    }
    catch(err) {
      return data;
    }
  }
  else {
    return data;
  }
}

exports.create = function() {
  return new FilterReverseDns();
}
