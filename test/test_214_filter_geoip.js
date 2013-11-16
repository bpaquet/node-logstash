var vows = require('vows'),
    filter_helper = require('./filter_helper');

vows.describe('Filter Geoip ').addBatch({
  'normal': filter_helper.create('geoip', 'ip', [
    {'titi': 'tata'},
    {'titi': 'tata', 'ip': 'toto'},
    {'titi': 'tata', 'ip': '91.121.153.187'},
    {'titi': 'tata', 'ip': '82.66.65.173'},
  ], [
    {'titi': 'tata'},
    {'titi': 'tata', 'ip': 'toto'},
    {'titi': 'tata', 'ip': '91.121.153.187', 'ip_geo_country': 'FR', 'ip_geo_lonlat': [ 2, 46 ] },
    {'titi': 'tata', 'ip': '82.66.65.173', 'ip_geo_country': 'FR', 'ip_geo_region': 'A8', 'ip_geo_city': 'Paris', 'ip_geo_lonlat': [ 2.3333, 48.8667 ]},
  ]),
  'hide city': filter_helper.create('geoip', 'ip?city_field=none', [
    {'titi': 'tata', 'ip': '82.66.65.173'},
  ], [
    {'titi': 'tata', 'ip': '82.66.65.173', 'ip_geo_country': 'FR', 'ip_geo_region': 'A8', 'ip_geo_lonlat': [ 2.3333, 48.8667 ]},
  ]),
  'hide country': filter_helper.create('geoip', 'ip?country_field=none', [
    {'titi': 'tata', 'ip': '82.66.65.173'},
  ], [
    {'titi': 'tata', 'ip': '82.66.65.173', 'ip_geo_region': 'A8', 'ip_geo_city': 'Paris', 'ip_geo_lonlat': [ 2.3333, 48.8667 ]},
  ]),
  'hide region': filter_helper.create('geoip', 'ip?region_field=none', [
    {'titi': 'tata', 'ip': '82.66.65.173'},
  ], [
    {'titi': 'tata', 'ip': '82.66.65.173', 'ip_geo_country': 'FR', 'ip_geo_city': 'Paris', 'ip_geo_lonlat': [ 2.3333, 48.8667 ]},
  ]),
  'hide lonlat': filter_helper.create('geoip', 'ip?lonlat_field=none', [
    {'titi': 'tata', 'ip': '82.66.65.173'},
  ], [
    {'titi': 'tata', 'ip': '82.66.65.173', 'ip_geo_country': 'FR', 'ip_geo_region': 'A8', 'ip_geo_city': 'Paris'},
  ]),
}).export(module);
