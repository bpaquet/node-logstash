Geoip filter
---

Status : core plugin, unit tested and maintained.

The geoip filter is used to perform a geoip lookup from a given field, and store teh result into current object.

After installing, to update the geoip database from maxmind, go to `node_modules/geoip-lite/` and execute `npm run-script updatedb`.

The reverse dns filter can be used before geop filter to resolve hostname.

Example 1: will lookup for ``ip`` field in the geoip database. The resulting object will contains following fields: ``ip_geo_country``, ``ip_geo_region``, ``ip_geo_city``, ``ip_geo_lonlat``, filled with geoip lookup result.

Config using url : ``filter://geoip://ip``

Config using logstash files :
````
filter {
  geoip {
    field => ip
  }
}
````

Parameters:

* ``field``: which field to work on.
* ``country_field``: field in which to store the geo ip country result. Default value : ``ip_geo_country``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip country result will not be stored.
* ``region_field``: field in which to store the geo ip region result. Default value : ``ip_geo_region``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip region result will not be stored.
* ``city_field``: field in which to store the geo ip city result. Default value : ``ip_geo_city``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip city result will not be stored.
* ``lonlat_field``: field in which to store the geo ip longitude and latitude result. Default value : ``ip_geo_lonlat`, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip longitude and latitude result will not be stored.
