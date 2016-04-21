* 22/04/2016 : Fields and tag management for input plugins
* 21/04/2016 : Fix #123 : Do not close file automatically in output file plugin
* 19/04/2016 : Fix #120 : Grok filter use match param, not grok
* 18/09/2015 : allow to load plugins from NODE_PATH
* 11/09/2015 : publish 0.0.5 on NPM
* 11/09/2015 : new config format, based on logstash config format
* 11/09/2015 : new installer using [packager.io](packager.io), thx to @crohr
* 11/09/2015 : mass documentation update
* 11/09/2015 : allow to use node-maxmind plugin for geoip filter. Geoip filter can now fetch ASN.
* 11/09/2015 : add cache on reverse dns and geoip filters
* 25/10/2015 : Reorganize doc
* 25/10/2015 : Update http proxy support for node > 0.10
* 24/10/2015 : drop 0.10 support, update test for node 4
* 24/10/2015 : use aws-sdk for aws SQS plugin

* 04/10/2015 : publish 0.0.4 on NPM
* 16/05/2015 : Allow to specify dates in computed values
* 13/05/2015 : Add basic auth for HTTP Output plugins (#100)
* 13/05/2015 : Add websockets support (thx to @fujifish)
* 4/04/2015 : Add raw unserializer (thx to @nfisher)
* 12/03/2015 : Allow wildcard in path for input file plugin
* 7/03/2015 : Allow to use fixed index name for ElasticSearch output
* 21/01/2015 : AMQP plain authentication, AMQP vhost
* 3/01/2015 : Add SQS Input / Output
* 9/11/2014 : publish 0.0.3 on NPM

* Add SSL Suport to AMPQ plugins
* Add bulk insert for ElasticSearch (thx to @fujifish)
* Add index_prefix configuration parameter for ElasticSearch (thx to @fujifish)
* Add AMQP / RabbitMQ input and output
* End of NodeJS 0.8 compatibility
* Add Grok filter (thx to @fujifish)
* Add GAE input
* Fix issue #70 with reconnect on TCP Output
* Fix issue #75 when stopping with TCP input
* Add only\_field\_match\_ options
* Do not log error with Geo IP filter and local ips
* Fix bug #62 : only_type not honored when component have no config (thx to @ryepup)
* Allow ZeroMQ output to multiple hosts (thx to @dax)
* Add bunyan filter (thx to @JonGretar)
* Implement BLPOP / RPUSH mechanism for redis, and use it by default. Thx to @perrinood.
* ElasticSearch indexes now use UTC, and default type value is logs instead of data
* Add wildcard for input file plugin
* Add delimiter for file and tcp plugins
* Auth on redis
* Improve dns reverse filter
* Compatibility with ZeroMQ 2.2.x, 3.x, 4.x
* Add USR1 signal to stop and start inputs plugins
* Add TCP / TLS plugin, thx to @dlanderson
* Add input HTTP plugin, thx to @fujifish
* Refactor SSL management
* Add GeopIP filter, thx to @subutux
* Add serializer and unserializer support
* Allow to use input file plugin on non existent directory
* Utf-8 is now the default encoding for input file plugin
* Add [Log.io](http://logio.org) output
* Use the 1.2 logstash json format
* Add redis input and output plugin
* Add tail -f input file plugin