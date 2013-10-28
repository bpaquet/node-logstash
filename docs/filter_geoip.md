Installation
============

go into the node-logstash directory and execute `npm install geoip-lite`

This install the [geoip-lite](https://github.com/bluesmoon/node-geoip) package.

Updating/retrieving the geoip databases is simple. cd to `node_modules/geoip-lite/` and execute `npm run-script updatedb`.
this will fetch the latest maxmind database files.

Usage
=====

by default, all data available in stored. This data is prefixed by the `use_attr` value. For ex. if `use_attr=postfix_source`
the variable containing the country code will be `postfix_source_geoipcountry` .

the saved data is as follows:

* _geoipcountry: the country code
* _geoipregion: the region
* _geoipcity: the city
* _geoiplonlat: an array containing the lat an lon (for use with bettermap in Kibana)

an example filter:

`filter://geoip://?use_attr=postfix_source`

this filter saves all the data into attributes beginning with `postfix_source_`.
