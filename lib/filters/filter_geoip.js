var base_filter = require('../lib/base_filter'),
    util = require('util'),
    geoip = require('geoip-lite'),
    logger = require('log4node');

function FilterGeoip() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'Geoip',
    optional_params: ['use_attr','save_country','save_region','save_city','save_latlon'],
    default_values: {
      'use_attr': 'host',
      'save_country': 'true',
      'save_region': 'true',
      'save_city': 'true',
      'save_latlon': 'false'
    }
  }
}

util.inherits(FilterGeoip, base_filter.BaseFilter);

FilterGeoip.prototype.afterLoadConfig = function(callback) {
  this.save_country = this.save_country == 'true';
  this.save_region = this.save_region == 'true';
  this.save_city = this.save_city == 'true';
  this.save_latlon = this.save_latlon == 'true';
  logger.info('Initialized geoip filter, use attr ', this.use_attr);
  logger.info('Initialized geoip filter, save country ', this.save_country);
  logger.info('Initialized geoip filter, save region ', this.save_region);
  logger.info('Initialized geoip filter, save city ', this.save_city);
  logger.info('Initialized geoip filter, save latlon ', this.save_latlon);
  callback();
}

FilterGeoip.prototype.process = function(data) {
  if (data[this.use_attr]) {
    try {
      var geo = geoip.lookup(data[this.use_attr]);
      logger.debug('Found country for ip ' + data[this.use_attr] , geo['country']);
      if (this.save_country && geo['country'] != "" ) {
	logger.debug('Found country for ip ' + data[this.use_attr] , geo['country']);
	data[this.use_attr + '_geo_country'] = geo['country'];
      }
      if (this.save_region && geo['region'] != "" ) {
	logger.debug(' Found region for ip ' + data[this.use_attr] , geo['region']);
	data[this.use_attr + '_geo_region'] = geo['region'];
      }
      if (this.save_city && geo['city'] != "" ) {
	logger.debug('Found city for ip ' + data[this.use_attr] , geo['city']);
	data[this.use_attr + '_geo_city'] = geo['city'];
      }
      if (this.save_latlon) {
	logger.debug('Found latlon for ip ' + data[this.use_attr] , geo['ll'][0] + ',' + geo['ll'][1]);
	data[this.use_attr + '_geo_lonlat'] = [geo['ll'][1],geo['ll'][0]];
      }
     
    }
    catch(err) {

      return data;
    }
   return data;
  }
  else {
    return data;
  }
}

exports.create = function() {
  return new FilterGeoip();
}
