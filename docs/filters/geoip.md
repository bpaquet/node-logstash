Geoip filter
---

Status : core plugin, unit tested and maintained.

The geoip filter is used to perform a geoip lookup from a given field, and store teh result into current object.

There are two mode :
* [node-geoip-lite](https://github.com/bluesmoon/node-geoip) plugin : the database is automatically fetch when you run npm install. To update the geoip database from maxmind, go to `node_modules/geoip-lite/` and execute `npm run-script updatedb`. This mode does not resolve ASN.
* [node-maxmind](https://github.com/runk/node-maxmind) plugin. You have to provide the ``maxmind_dir`` param to specify the directory in which you deployed the Geolite db files. This mode support ASN resolving. You can use the node module [maxmind-geolite-mirror](https://github.com/msimerson/maxmind-geolite-mirror) to fill up the geolite directory. The plugin needs two file in the maxmind directory : ``GeoIPCity.dat`` and ``GeoIPASNum.dat``.

The reverse dns filter can be used before geop filter to resolve hostname.

Example 1: will lookup for ``ip`` field in the geoip database, using node-geoip-lite. The resulting object will contains following fields: ``ip_geo_country``, ``ip_geo_region``, ``ip_geo_city``, ``ip_geo_lonlat``, filled with geoip lookup result.
Config using url: ``filter://geoip://ip``

Config using logstash format:
````
filter {
  geoip {
    field => ip
  }
}
````

Example 2: will lookup for ``http_remote_ip`` field in provided maxmind directory, using node-maxmin. The resulting object will contains following fields: ``http_remote_ip_geo_country``, ``http_remote_ip_geo_region``, ``http_remote_ip_geo_city``, ``http_remote_ip_geo_lonlat``, ``http_remote_ip_geo_asn`` filled with geoip lookup result.
Config using url: ``filter://geoip://http_remote_ip?maxmind_dir=/var/db/maxmind&cache_size=1000``

Config using logstash format:
````
filter {
  geoip {
    field => http_remote_ip
    cache_size => 1000
    maxmind_dir => /var/db/maxmind
  }
}
````

Parameters:

* ``field``: which field to work on.
* ``country_field``: field in which to store the geo ip country result. Default value : ``ip_geo_country``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip country result will not be stored.
* ``region_field``: field in which to store the geo ip region result. Default value : ``ip_geo_region``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip region result will not be stored.
* ``city_field``: field in which to store the geo ip city result. Default value : ``ip_geo_city``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip city result will not be stored.
* ``lonlat_field``: field in which to store the geo ip longitude and latitude result. Default value : ``ip_geo_lonlat``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip longitude and latitude result will not be stored.
* ``asn_field``: field in which to store the asn result. Default value : ``ip_geo_asn``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip asn result will not be stored.
* ``cache_*``: cache configuration. More doc at [cache](../cache.md).

#### Note if you are using the native package

For reduce the size of the package, the native package does not contains any geoip database.
The recommended mode is ``node-maxmind``.

To enable it, just type

    node-logstash config:set MAXMIND_DB_DIR=/var/db/node-logstash/maxmind/
    node-logstash run node_modules/.bin/maxmind-geolite-mirror
    service node-logstash restart

The geoip plugin will use the env var ``MAXMIND_DB_DIR`` be auto configured (the ``maxmind_dir``is not needed.).

To refresh the database, just add a weekly cron

    2 2 0 * * node-logstash run node_modules/.bin/maxmind-geolite-mirror
