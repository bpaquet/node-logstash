var vows = require('vows'),
  geoip = require('geoip-lite'),
  filter_helper = require('./filter_helper');

var ip1 = '91.121.153.187';
var ip1_res = geoip.lookup(ip1);

var ip2 = '82.66.65.173';
var ip2_res = geoip.lookup(ip2);

vows.describe('Filter Geoip ').addBatch({
  'normal': filter_helper.create('geoip', 'ip', [
    {
      'titi': 'tata'
    },
    {
      'titi': 'tata',
      'ip': 'toto'
    },
    {
      'titi': 'tata',
      'ip': ip1
    },
    {
      'titi': 'tata',
      'ip': ip2
    },
  ], [
    {
      'titi': 'tata'
    },
    {
      'titi': 'tata',
      'ip': 'toto'
    },
    {
      'titi': 'tata',
      'ip': ip1,
      'ip_geo_country': ip1_res.country,
      'ip_geo_lonlat': [ip1_res.ll[1], ip1_res.ll[0]]
    },
    {
      'titi': 'tata',
      'ip': ip2,
      'ip_geo_country': ip2_res.country,
      'ip_geo_region': ip2_res.region,
      'ip_geo_city': ip2_res.city,
      'ip_geo_lonlat': [ip2_res.ll[1], ip2_res.ll[0]]
    },
  ]),
  'hide city': filter_helper.create('geoip', 'ip?city_field=none', [
    {
      'titi': 'tata',
      'ip': ip2
    },
  ], [
    {
      'titi': 'tata',
      'ip': ip2,
      'ip_geo_country': ip2_res.country,
      'ip_geo_region': ip2_res.region,
      'ip_geo_lonlat': [ip2_res.ll[1], ip2_res.ll[0]]
    },
  ]),
  'hide country': filter_helper.create('geoip', 'ip?country_field=none', [
    {
      'titi': 'tata',
      'ip': ip2
    },
  ], [
    {
      'titi': 'tata',
      'ip': ip2,
      'ip_geo_region': ip2_res.region,
      'ip_geo_city': ip2_res.city,
      'ip_geo_lonlat': [ip2_res.ll[1], ip2_res.ll[0]]
    },
  ]),
  'hide region': filter_helper.create('geoip', 'ip?region_field=none', [
    {
      'titi': 'tata',
      'ip': ip2
    },
  ], [
    {
      'titi': 'tata',
      'ip': ip2,
      'ip_geo_country': ip2_res.country,
      'ip_geo_city': ip2_res.city,
      'ip_geo_lonlat': [ip2_res.ll[1], ip2_res.ll[0]]
    },
  ]),
  'hide lonlat': filter_helper.create('geoip', 'ip?lonlat_field=none', [
    {
      'titi': 'tata',
      'ip': ip2
    },
  ], [
    {
      'titi': 'tata',
      'ip': ip2,
      'ip_geo_country': ip2_res.country,
      'ip_geo_region': ip2_res.region,
      'ip_geo_city': ip2_res.city
    },
  ]),
}).export(module);
