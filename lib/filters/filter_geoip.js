var base_filter = require('../lib/base_filter'),
  cache_helper = require('../lib/cache_helper'),
  util = require('util'),
  logger = require('log4node');

function FilterGeoip() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig(cache_helper.config());
  this.mergeConfig({
    name: 'Geoip',
    optional_params: ['country_field', 'region_field', 'city_field', 'lonlat_field', 'maxmind_dir'],
    host_field: 'field',
    default_values: {
      'country_field': '__default__',
      'region_field': '__default__',
      'city_field': '__default__',
      'lonlat_field': '__default__',
      'asn_field': '__default__',
    },
    start_hook: this.start,
  });
}

util.inherits(FilterGeoip, base_filter.BaseFilter);

FilterGeoip.prototype.start = function(callback) {
  var maxmind;
  var geoip;
  if (process.env.MAXMIND_DB_DIR) {
    this.maxmind_dir = process.env.MAXMIND_DB_DIR;
  }
  if (this.maxmind_dir) {
    maxmind = require('maxmind');
    logger.info('Initializing geoip filter from directory', this.maxmind_dir);
    maxmind.init(['GeoIPCity.dat', 'GeoIPASNum.dat'].map(function(x) {
      return this.maxmind_dir + '/' + x;
    }.bind(this)), {checkForUpdates: true});
  }
  else {
    geoip = require('geoip-lite');
    geoip.startWatchingDataUpdate();
  }
  if (this.country_field === '__default__') {
    this.country_field = this.field + '_geo_country';
  }
  if (this.region_field === '__default__') {
    this.region_field = this.field + '_geo_region';
  }
  if (this.city_field === '__default__') {
    this.city_field = this.field + '_geo_city';
  }
  if (this.lonlat_field === '__default__') {
    this.lonlat_field = this.field + '_geo_lonlat';
  }
  if (this.asn_field === '__default__') {
    this.asn_field = this.field + '_geo_asn';
  }
  logger.info('Initialized geoip filter, ip field', this.field);
  logger.info('Initialized geoip filter, country field', this.country_field);
  logger.info('Initialized geoip filter, region field', this.region_field);
  logger.info('Initialized geoip filter, city field', this.city_field);
  logger.info('Initialized geoip filter, latlon field', this.lonlat_field);
  logger.info('Initialized geoip filter, asn field', this.asn_field);
  this.cache_miss = function(key, callback) {
    var geo;
    if (this.maxmind_dir) {
      var r = maxmind.getLocation(key);
      if (r) {
        geo = {
          country: r.countryCode,
          region: r.region,
          city: r.city,
          asn: maxmind.getAsn(key),
        };
        if (r.latitude && r.longitude) {
          geo.ll = [Number((r.latitude).toFixed(4)), Number((r.longitude).toFixed(4))];
        }
      }
    }
    else {
      geo = geoip.lookup(key);
    }
    callback(undefined, geo);
  }.bind(this);
  callback();
};

FilterGeoip.prototype.process = function(data) {
  var ip = data[this.field];
  if (ip &&
    ip !== '-' &&
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
    this.cache(ip, function(err, geo) {
      if (err) {
        logger.info('Unable to geoip lookup', ip, ':', err);
      }
      else if (geo) {
        if (this.country_field !== 'none' && geo.country && geo.country !== '') {
          logger.debug('Storing country for ip ' + ip, geo.country);
          data[this.country_field] = geo.country;
        }
        if (this.region_field !== 'none' && geo.region && geo.region !== '') {
          logger.debug('Storing region for ip ' + ip, geo.region);
          data[this.region_field] = geo.region;
        }
        if (this.city_field !== 'none' && geo.city && geo.city !== '') {
          logger.debug('Storing city for ip ' + ip, geo.city);
          data[this.city_field] = geo.city;
        }
        if (this.asn_field !== 'none' && geo.asn && geo.asn !== '') {
          logger.debug('Storing asn for ip ' + ip, geo.asn);
          data[this.asn_field] = geo.asn;
        }
        if (this.lonlat_field !== 'none' && geo.ll) {
          logger.debug('Storing latlon for ip ' + ip, geo.ll[0] + ',' + geo.ll[1]);
          data[this.lonlat_field] = [geo.ll[1], geo.ll[0]];
        }
      }
      else {
        logger.info('Unable to geoip lookup', ip);
      }
    }.bind(this));
  }
  return data;
};

exports.create = function() {
  return new FilterGeoip();
};