var base_filter = require('../lib/base_filter'),
  util = require('util'),
  geoip = require('geoip-lite'),
  logger = require('log4node');

function FilterGeoip() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Geoip',
    optional_params: ['country_field', 'region_field', 'city_field', 'lonlat_field'],
    host_field: 'field_name',
    default_values: {
      'country_field': '__default__',
      'region_field': '__default__',
      'city_field': '__default__',
      'lonlat_field': '__default__',
    },
    start_hook: this.start,
  });
}

util.inherits(FilterGeoip, base_filter.BaseFilter);

FilterGeoip.prototype.start = function(callback) {
  if (this.country_field === '__default__') {
    this.country_field = this.field_name + '_geo_country';
  }
  if (this.region_field === '__default__') {
    this.region_field = this.field_name + '_geo_region';
  }
  if (this.city_field === '__default__') {
    this.city_field = this.field_name + '_geo_city';
  }
  if (this.lonlat_field === '__default__') {
    this.lonlat_field = this.field_name + '_geo_lonlat';
  }
  logger.info('Initialized geoip filter, ip field', this.field_name);
  logger.info('Initialized geoip filter, country field', this.country_field);
  logger.info('Initialized geoip filter, region field', this.region_field);
  logger.info('Initialized geoip filter, city field', this.city_field);
  logger.info('Initialized geoip filter, latlon field', this.lonlat_field);
  callback();
};

FilterGeoip.prototype.process = function(data) {
  var ip = data[this.field_name];
  if (ip &&
    ip.indexOf('10.') !== 0 &&
    ip.indexOf('192.168.') !== 0 &&
    ip.indexOf('172.16') !== 0 &&
    ip.indexOf('172.17') !== 0 &&
    ip.indexOf('172.18') !== 0 &&
    ip.indexOf('172.19') !== 0 &&
    ip.indexOf('172.20') !== 0 &&
    ip.indexOf('172.21') !== 0 &&
    ip.indexOf('172.22') !== 0 &&
    ip.indexOf('172.23') !== 0 &&
    ip.indexOf('172.24') !== 0 &&
    ip.indexOf('172.25') !== 0 &&
    ip.indexOf('172.26') !== 0 &&
    ip.indexOf('172.27') !== 0 &&
    ip.indexOf('172.28') !== 0 &&
    ip.indexOf('172.29') !== 0 &&
    ip.indexOf('172.30') !== 0 &&
    ip.indexOf('172.31') !== 0 &&
    ip.indexOf('127.0.0.1') !== 0
    ) {
    var geo = geoip.lookup(ip);
    if (geo) {
      if (this.country_field !== 'none' && geo.country !== '') {
        logger.debug('Storing country for ip ' + ip, geo.country);
        data[this.country_field] = geo.country;
      }
      if (this.region_field !== 'none' && geo.region !== '') {
        logger.debug('Storing region for ip ' + ip, geo.region);
        data[this.region_field] = geo.region;
      }
      if (this.city_field !== 'none' && geo.city !== '') {
        logger.debug('Storing city for ip ' + ip, geo.city);
        data[this.city_field] = geo.city;
      }
      if (this.lonlat_field !== 'none' && geo.ll) {
        logger.debug('Storing latlon for ip ' + ip, geo.ll[0] + ',' + geo.ll[1]);
        data[this.lonlat_field] = [geo.ll[1], geo.ll[0]];
      }
    }
    else {
      logger.info('Unable to geoip lookup', ip);
    }
  }
  return data;
};

exports.create = function() {
  return new FilterGeoip();
};
