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
  'local': filter_helper.create('geoip', 'ip', [
    {
      'ip': '10.0.0.1',
    },
    {
      'ip': '192.168.0.1',
    },
    {
      'ip': '172.16.0.1',
    },
    {
      'ip': '172.17.0.1',
    },
    {
      'ip': '172.18.0.1',
    },
    {
      'ip': '172.19.0.1',
    },
    {
      'ip': '172.20.0.1',
    },
    {
      'ip': '172.21.0.1',
    },
    {
      'ip': '172.22.0.1',
    },
    {
      'ip': '172.23.0.1',
    },
    {
      'ip': '172.24.0.1',
    },
    {
      'ip': '172.25.0.1',
    },
    {
      'ip': '172.26.0.1',
    },
    {
      'ip': '172.27.0.1',
    },
    {
      'ip': '172.28.0.1',
    },
    {
      'ip': '172.29.0.1',
    },
    {
      'ip': '172.30.0.1',
    },
    {
      'ip': '172.31.0.1',
    },
    {
      'ip': '127.0.0.1',
    },
  ], [
    {
      'ip': '10.0.0.1',
    },
    {
      'ip': '192.168.0.1',
    },
    {
      'ip': '172.16.0.1',
    },
    {
      'ip': '172.17.0.1',
    },
    {
      'ip': '172.18.0.1',
    },
    {
      'ip': '172.19.0.1',
    },
    {
      'ip': '172.20.0.1',
    },
    {
      'ip': '172.21.0.1',
    },
    {
      'ip': '172.22.0.1',
    },
    {
      'ip': '172.23.0.1',
    },
    {
      'ip': '172.24.0.1',
    },
    {
      'ip': '172.25.0.1',
    },
    {
      'ip': '172.26.0.1',
    },
    {
      'ip': '172.27.0.1',
    },
    {
      'ip': '172.28.0.1',
    },
    {
      'ip': '172.29.0.1',
    },
    {
      'ip': '172.30.0.1',
    },
    {
      'ip': '172.31.0.1',
    },
    {
      'ip': '127.0.0.1',
    },
  ]),
}).export(module);
