node-logstash
====

[![Build Status](https://travis-ci.org/bpaquet/node-logstash.png)](https://travis-ci.org/bpaquet/node-logstash)

What is it ?
---

It's a [NodeJS](http://nodejs.org) implementation of [Logstash](http://logstash.net/).


What to do with node-logstash ?
---

node-logstash is a tool to collect logs on servers. It allow to send its to a central server and to [ElasticSearch](http://www.elasticsearch.org/) for indexing.

In top of elastic search, you can use a specialized interface like [kibana](http://rashidkpc.github.com/Kibana/) to dive into your logs.

![Archi](https://raw.github.com/bpaquet/node-logstash/master/docs/archi.jpg)

Why a new implementation ?
---

When I tried logstash, I had some problems. This version should have:

* lower memory footprint
* lower cpu footprint
* faster startup delay

Moreover it's written in NodeJS, which is a perfect language for programs with many IO.

node-logstash is compatible with logstash. You can replace a node-logstash node by a logstash one. The data are formatted in the same way to be compatible with logstash UIs.

How does it works ?
===

The architecture is identical to logstash architecture. You have to instanciates plugins with the node-logstash core. There are three type of modules:

* [inputs plugins](#inputs): where datas come into node-logstash. Examples: file, zeromq transport layer
* [filter plugins](#filters): extract fields from logs, like timestamps. Example: regex plugin
* [outputs plugins](#outputs): where datas leave from node-logstash: Examples: ElasticSearch , zeromq transport layer.


A typical node-logstash deployement contains agents to crawl logs and a log server.

On agent, node-logstash is configured whith inputs plugins to get logs from your software stack, and one output plugin to send logs to log server (eg. zeromq output plugin).

On log server, logs come trough a zeromq input plugin, are processed (fields and timestamps extraction), and send to ElasticSearch.

How to get help ?
===

Please mail the users groups : node-logstash-users@googlegroups.com, or open an [issue](https://github.com/bpaquet/node-logstash/issues).

How to use it ?
===

Installation
---

* Install NodeJS, version >= 0.10.
* Install build tools
  * Debian based system: `apt-get install build-essential`
  * Centos system: `yum install gcc gcc-c++ make`
* Install zmq dev libraries: This is required to build the [node zeromq module](https://github.com/JustinTulloss/zeromq.node).
  * Debian based system: `apt-get install libzmq1`. Under recent releases, this package is present in default repositories. On ubuntu lucid, use this [ppa](https://launchpad.net/~chris-lea/+archive/zeromq). On debian squeeze, use [backports](http://backports-master.debian.org/Instructions/).
  * Centos 6: `yum install zeromq zeromq-devel`. Before, you have to add the rpm zeromq repo : `curl http://download.opensuse.org/repositories/home:/fengshuo:/zeromq/CentOS_CentOS-6/home:fengshuo:zeromq.repo > /etc/yum.repos.d/zeromq.repo`
* Clone repository: `git clone git://github.com/bpaquet/node-logstash.git && cd node-logstash`
* Install dependencies: `npm install`.

The executable is in ``bin/node-logstash-agent``

You have scripts in ``dists`` folder to build packages. Actually, only debian is supported.

Configuration
---

Configuration is done by url. A plugin is instanciated by an url. Example: ``input://file:///tmp/toto.log``. This url
instanciate an input file plugin which monitor the file ``/tmp/toto.log`.

The urls can be specified:

* directly on the command line
* in a file (use the ``--config_file`` switch)
* in all files in a directory (use the ``--config_dir`` switch)

Others params:

* ``--log_level`` to change the log level (emergency, alert, critical, error, warning, notice, info, debug)
* ``--log_file`` to redirect log to a log file.
* ``--patterns_directories`` to add some directories (separated by ,), for loading config for regex plugin and grok plugins. Grok patterns files must be located under a ``grok`` subdirectory for each specified directory.
* ``--db_file`` to specify the file to use as database for file inputs (see below)
* ``--http_max_sockets`` to specify the max sockets of [http.globalAgent.maxSockets](http://nodejs.org/api/http.html#http_agent_maxsockets). Default to 100.
* ``--alarm_file`` to specify a file which will be created if node-logstash goes in alarm mode (see below).

Examples
---

Config file for an agent:

    input://file:///var/log/nginx/access.log
    output://zeromq://tcp://log_server:5555

Config file for log server:

    input://zeromq://tcp://0.0.0.0:5555
    filter://regex://http_combined
    output://elasticsearch://localhost:9001

Signals
---

* USR1: stoping or starting all inputs plugins. Can be used to close input when output targer are failing
* USR2: see below file output plugin

Changelog
===

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

Plugins list
===

Inputs
---

* [File](#file)
* [Syslog](#syslog)
* [ZeroMQ](#zeromq)
* [Redis](#redis)
* [HTTP](#http)
* [TCP / TLS](#tcp--tls)
* [Google app engine](#google-app-engine)
* [AMQP](#amqp)

Filters
---

* [Regex](#regex)
* [Grok](#grok)
* [Mutate Replace](#mutate-replace)
* [Grep](#grep)
* [Reverse DNS](#reverse-dns)
* [Compute field](#compute-field)
* [Compute date field](#compute-date-field)
* [Split](#split)
* [Multiline](#multiline)
* [Json fields](#json-fields)
* [Geoip](#geoip)
* [Eval](#eval)
* [Bunyan](#bunyan)
* [HTTP Status Classifier](#http-status-classifier)

Outputs
---

* [ZeroMQ](#zeromq-1)
* [ElasticSearch](#elasticsearch)
* [Statsd](#statsd)
* [Gelf](#gelf)
* [File](#file-1)
* [HTTP Post](#http-post)
* [Redis](#redis-1)
* [Logio](#logio)
* [TCP / TLS](#tcp--tls-1)
* [AMQP](#amqp-1)


Inputs plugins
===

Unserializers :

Some inputs plugins supports the ``unserializer`` params.
Supported unserializer for input plugin :

* ``json_logstash``: the unserializer try to parse data as a json object. If fail, raw data is returned. Some input plugins can not accept raw data.
* ``msgpack``: the unserializer try to parse data as a [msgpack](http://msgpack.org) object. If fail, raw data is returned. Some input plugins can not accept raw data.

File
---

This plugin monitor log files.

Wildcard (* and ?) can be used.

This plugin is compatible with logrotate.

If a db file is specified on node-logstash command line (``--db_file``), this plugin stores the last line read for each file, to allow restart at the same place, even the monitored file grows when node-logstash were down.

Example:
* ``input://file:///tmp/toto.log``, to monitor ``/tmp/toto.log``.
* ``input://file:///var/log/*.log``, to monitor all log file in ``/var/log``.
* ``input://file:///var/log/auth%3F.log``, to monitor all files matching ``auth?.log`` in ``/var/log``. ``%3F`` is the encoding of ``?``.

Parameters:

* ``start_index``: add ``?start_index=0`` to reread files from begining. Without this params, only new lines are read.
* ``use_tail``: use system ``tail -f`` command to monitor file, instead of built in file monitoring. Should be used with logrotate and copytuncate option. Defaut value: false.
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=nginx_error_log``.
* ``unserializer``: please see above. Default value to ``json_logstash``.

Note: this plugin can be used on FIFO pipes.

Syslog
---

There is no syslog plugin, but it's easy to emulate with udp plugin.

Example:

* ``input://udp://0.0.0.0:514?type=syslog``
* ``filter://regex://syslog?only_type=syslog``
* ``filter://syslog_pri://?only_type=syslog``

The first filter will parse the syslog line, and extract ``syslog_priority``, ``syslog_program``, ``syslog_pid`` fields,
parse timestamp, and will replace ``host`` and ``message`` field.

The second filter will extract from ``syslog_priority`` field severity and facility.

You can also use the regex ``syslog_no_prio`` if there is no timestamp in syslog lines

* ``input://udp://0.0.0.0:514?type=syslog``
* ``filter://regex://syslog_no_prio?only_type=syslog``

ZeroMQ
---

This plugin is used on log server to receive logs from agents.

Example: ``input://zeromq://tcp://0.0.0.0:5555``, to open a zeromq socket on port 5555.

Parameters :
* ``unserializer``: please see above. Default value to ``json_logstash``. This plugin does not support raw data.

Redis
---

This plugin is used on log server to receive logs from redis channels. json_event format is expected.

They are two method to get message from redis :
* Publish / subscribe : The ``subscribe`` redis command will be used. Parameters ``channel`` and ``pattern_channel`` are needed.
* Queue. This ``blpop`` redis command will be used. ``key`` parameter is needed.

Example:

* ``input://redis://localhost:6379?channel=logstash_channel``

Parameters:

* ``auth_pass``: password to use when connecting to Redis
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=redis``. No default value.
* ``method``: ``pubsub`` or ``queue`` Default value: ``queue``.
* ``channel``: Channel for publish / subscribe. No default value.
* ``pattern_channel``: use channel as pattern. Default value : false.
* ``key``: Queue name for queue. No default value.
* ``unserializer``: please see above. Default value to ``json_logstash``.

HTTP
---

This plugin is used on log server to receive logs from an HTTP/HTTPS stream. This is useful
in case the agent can only output logs through an HTTP/HTTPS channel.

Example:

* ``input://http://localhost:8080``

Parameters:

* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=http``. No default value.
* ``unserializer``: please see above. Default value to ``json_logstash``.
* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false

TCP / TLS
---
This plugin is used on log server to receive data over TCP, optionnaly with SSL/TLS encryption.

Examples:

* TCP mode: ``input://tcp://0.0.0.0:12345``
* SSL mode: ``input://tcp://0.0.0.0:443?ssl=true&ssl_key=/etc/ssl/private/logstash-server.key&ssl_cert=/etc/ssl/private/logstash-server.crt&ssl_requestCert=true&ssl_rejectUnauthorized=true``

Parameters:

* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false
* ``appendPeerCert``: Optional. In SSL mode, adds details of the peer certificate to the @tls field if the peer certificate was received from the client using requestCert option. Default: true in SSL mode
* ``type``: Optional. To specify the log type, to faciliate crawling in kibana. Example: ``type=tls``. No default value.
* ``unserializer``: Optional. Please see above. Default value to ``json_logstash``.

Google App Engine
---
This plugin is used to collect logs from a running Google App Engine Application.

You have to add a [servlet in your App Engine App](docs/gae/Readme.md). The plugin will poll the logs from this servlet.

This plugin collects logs 10s in the past to allow GAE internal logs propagation.

Examples:

* ``input://gae://myapp.appspot.com:80?key=toto``. Will grab the logs from myapp GAE app, every minutes, on url ``http://myapp.appspot.com:80/logs?log_key=toto``

Parameters:

* ``type``: Optional. To specify the log type, to faciliate crawling in kibana. Example: ``type=mygaeappp``. No default value.
* ``key``. The security key which will be sent in the http query to Google App Engine.
* ``ssl``: use ssl for grabbing logs. Use port 443 in this case. Default : false.
* ``polling``: Polling delay. Default: 60s.
* ``servlet_name``: Name of the servlet which serve logs. Default : ``logs``.
* ``access_logs_field_name`` and ``access_logs_type``. If the received line of log has a field ``access_logs_field_name``, the plugin will set the type of the line to ``access_logs_type``. It's used to differentiate access logs from application logs, to apply specific filter on access_logs. Standard config is : ``access_logs_type=nginx_access_logs&access_logs_field_name=http_method``. No default value.

AMQP
---
This plugin is used to get logs from an [AMQP exchange](https://www.rabbitmq.com/tutorials/amqp-concepts.html), like a [RabbitMQ](http://www.rabbitmq.com/) exchange. This plugin is compatible with the original AMQP logstash plugin.

Examples:

* Fanout mode: ``input://amqp://localhost:5672?exchange_name=toto`` : Receive message from fanout exchange ``toto``
* Topic mode: ``input://amqp://localhost:5672?exchange_name=toto_topic&topic=test`` : Receive message from topic ``test`` on  exchange ``toto_topic``

Parameters:

* ``topic``: Optional. Topic to use in topic mode. Default : none, fanout mode is used.
* ``durable``: Optional. Set exchange durability. Default : true.
* ``retry_delay``: Optional. Retry delay (in ms) to connect AMQP broker. Default : 3000.
* ``heartbeat``: Optional. AMQP heartbeat in s. Default: 10
* ``type``: Optional. To specify the log type, to faciliate crawling in kibana. Example: ``type=rabbit``. No default value.
* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false
* ``unserializer``: Optional. Please see above. Default value to ``json_logstash``.

Outputs and filter, commons parameters
===

* ``only_type``: execute the filter / output plugin only on lines with specified type. Example: ``only_type=nginx``
* ``only_field_exist_toto``: execute the filter / output plugin only on lines with a field ``toto``. You can specify it multiple times, all fields have to exist.
* ``only_field_equal_toto=aaa``: execute the filter / output plugin only on lines with a field ``toto``, with value ``aaa``. You can specify it multiple times, all fields have to exist and have the specified value.
* ``only_field_match_toto=aaa$``: execute the filter / output plugin only on lines with a field ``toto``, with value match the regular expression ``aaa$``. You can specify it multiple times, all fields have to exist and match the regular expression.

Access to line log properties
===

Some params are string, which can reference line log properties:

* ``#{message}`` will contain the full log line
* ``#{type}`` will contain the type of log line
* ``#{toto}`` will contain the value of the field ``toto``, which have to be extracted with a regex filter
* ``2#{toto}`` will contain ``2`` followed by the value of the field ``toto``.

Ouputs plugins
===

Serializer :

Some outputs plugins support the ``serializer`` params.
Supported serializer for output plugin :

* ``json_logstash``: this serializer dumps the log line to a JSON Object.
* ``msgpack``: this serializer dumps the log line to a [msgpack](http://msgpack.org) Object.
* ``raw``: this serializer dumps the log line to a string, given in the ``format`` parameter. The ``format`` string can reference log lines properties (see above). Default ``format`` value is ``#{message}``.

ZeroMQ
---

This plugin is used on agents to send logs to logs servers, or to send logs to [Elasticsearch Logstash River](https://github.com/bpaquet/elasticsearch-river-zeromq).

Example 1: ``output://zeromq://tcp://192.168.1.1:5555``, to send logs to 192.168.1.1 port 5555.
Example 1: ``output://zeromq://tcp://192.168.1.1:5555,tcp://192.168.1.2:5555``, to send logs to 192.168.1.1 and 192.168.1.1, using built in ZeroMQ load balancing feature.

There are two queues in ZeroMQ output plugin :

* in the ZeroMQ library (see high watermark below). Default size: unlimited
* in the ZeroMQ NodeJS driver. Size is unlimited.

Parameters:

* ``serializer``: please see above. Default value to ``json_logstash``.
* ``format``: please see above. Used by the ``raw``serializer.
* ``zmq_high_watermark``: set the high watermark param on [ZeroMQ socket](http://api.zeromq.org/2-1:zmq-setsockopt). Default : no value.
* ``zmq_threshold_up``: if the NodeJS driver queues size goes upper this threshold, node-losgstash will stop every inputs plugins to avoid memory exhaustion. Default : no value.
* ``zmq_threshold_down``: if the NodeJS driver queues size goes down this threshold and inputs plugins are stopped, node-losgstash will start every inputs plugins. Default : no value.
* ``zmq_check_interval``: if set, the plugin will check the NodeJS driver queue status to go out of alarm mode. Default : no value. Unit is milliseconds

ElasticSearch
---

This plugin is used on log server to send logs to ElasticSearch, using HTTP REST interface.

By default, each incoming message generate one HTTP request to ElasticSearch. The bulk feature allows to send grouped messages. For example, under heavy traffic, you can send messages to ElasticSearch by bulk of 1000 messages. In this mode, the bulk is send even if incomplete after a configured timeout (100 ms by default).

Note : for better performance, you can use the ZeroMQ plugin and the [ZeroMQ Logasth river](https://github.com/bpaquet/elasticsearch-river-zeromq).

Example 1: ``output://elasticsearch://localhost:9001`` to send to the HTTP interface of an ElasticSearch server listening on port 9001.
Example 2: ``output://elasticsearch://localhost:9001&index_prefix=audit&data_type=audits`` to send to index ``audit-<date>`` and type ``audits``.
Example 3: ``output://elasticsearch://localhost:9001?bulk_limit=1000&bulk_timeout=100`` to perform bulk updates with a limit of 1000 messages per bulk update and a timeout of 100 ms to wait for 'limit' messages.

Parameters:
* ``index_prefix``: specifies the index prefix that messages will be stored under. Default : ``logstash``. Default index will be ``logstash-<date>``
* ``data_type``: specifies the type under the index that messages will be stored under. (default is ``logs``)
* ``bulk_limit``: Enable bulk mode. Dpecifies the maximum number of messages to store in memory before bulking to ElasticSearch. No default value.
* ``bulk_timeout``: Specifies the maximum number of milliseconds to wait for ``bulk_limit`` messages,. Default is 100.
* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false
* ``proxy``: use http proxy. See below for HTTP proxy. Default : none.

Statsd
---

This plugin is used send data to statsd.

Example: ``output://statsd://localhost:8125?only_type=nginx&metric_type=increment&metric_key=nginx.request``, to send, for each line of nginx log, a counter with value 1, key ``nginx.request``, on a statsd instance located on port 8125.

Parameters:

* ``metric_type``: one of ``increment``, ``decrement``, ``counter``, ``timer``, ``gauge``. Type of value to send to statsd.
* ``metric_key``: key to send to statsd.
* ``metric_value``: metric value to send to statsd. Mandatory for ``timer``, ``counter`` and ``gauge`` type.

``metric_key`` and ``metric_value`` can reference log line properties (see above).

Example: ``metric_key=nginx.response.#{status}``

Gelf
---

This plugin is used to send data to a GELF enabled server, eg [Graylog2](http://graylog2.org/). Documentation of GELF messages is [here](https://github.com/Graylog2/graylog2-docs/wiki/GELF).

Example: ``output://gelf://192.168.1.1:12201``, to send logs to 192.168.1.1 port 1221.

Parameters:

* ``message``: ``short_message`` field. Default value: ``#{message}``, the line of log. Can reference log line properties (see above).
* ``facility``: ``facility`` field. Default value: ``#{type}``, the line type. ``no_facility`` if no value. Can reference log line properties (see above).
* ``level``: ``level`` field. Default value: ``6``. Can reference log line properties (see above).
* ``version``: ``version`` field. Default value: ``1.0``.

File
---

This plugin is used to write data into files. There are two modes: JSON, and raw (default).

In JSON mode, each line of log is dumped to target file as JSON object, containing all fields.

In raw mode, each line of log is dumped to target file as specified in ``format`` parameter. Default format is ``#{message}``, which means the original log line.

Note: target files can be reopened by sending USR2 signal to node-logstash.

Example 1: ``output://file:///var/log/toto.log?only_type=nginx``, to write each ``nginx`` log lines to ``/var/log/toto.log``.

Parameters:

* ``serializer``: please see above. Default value to ``raw``.
* ``delimiter``: Optional. Delimiter inserted between message. Default : ``\n``. Must be encoded in url (eg ``%0A`` for ``\n``). Can be empty.
* ``format``: please see above. Used by the ``raw``serializer.

HTTP Post
---

This plugin is used to send data to an HTTP server, with a POST request. For filling request body, there are two modes: JSON, and raw (default).

In JSON mode, the HTTP POST body request will contain a JSON dump of log line, containing all fields. Content-Type will be set to ``text/plain``.

In raw mode, the HTTP POST body request will contain the log line. Content-Type will be set to ``application/json``.

Example 1: Send data to [Loggly](http://loggly.com/): ``output://http_post://logs.loggly.com:80?path=/inputs/YOUR_INPUT_KEY``

Parameters:

* ``path``: path to use in the HTTP request. Can reference log line properties (see above).
* ``serializer``: please see above. Default value to ``json_logstash``.
* ``format``: please see above. Used by the ``raw``serializer.
* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false
* ``proxy``: use http proxy. See below for HTTP proxy. Default : none.

Redis
---

This plugin is used to sent data on a Redis channel.

They are two method to send message from redis :
* Publish / subscribe : The ``publsh`` redis command will be used. ``channel` parameter is needed.
* Queue. This ``rpush`` redis command will be used. ``key`` parameter is needed.

Example:

* ``output://redis://localhost:6379?channel=logstash_channel``

Parameters:

* ``auth_pass``: password to use when connecting to Redis
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=app_name_log``.
* ``method``: ``pubsub`` or ``queue``. Method to use for redis messaging.
* ``channel``: Channel for publish / subscribe. No default value.
* ``key``: Queue name for queue. No default value.
* ``serializer``: please see above. Default value to ``json_logstash``.
* ``format``: please see above. Used by the ``raw``serializer.

Logio
---

This plugin is used to sent data to a [Log.io](http://logio.org) server.

Example:

* ``output://logio://localhost:28777``

Parameters:

* ``priority`` to change the line priority. Can reference log line properties. Default value: ``info``.
* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false
* ``proxy``: use http proxy. See below for HTTP proxy. Default : none.

TCP / TLS
---

This plugin is used on log clients to send data over TCP, optionnaly with SSL/TLS encryption.

Example:

* TCP mode:  ``output://tcp://192.168.1.1:12345``
* SSL Mode: ``output://tcp://192.168.1.1:443?ssl=true&ssl_key=/etc/ssl/private/logstash-client.key&ssl_cert=/etc/ssl/private/logstash-client.crt&ssl_rejectUnauthorized=true``

Parameters:

* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false
* ``serializer``: Optional. Please see above. Default value to ``json_logstash``.
* ``format``: Optional. Please see above. Used by the ``raw``serializer.
* ``delimiter``: Optional. Delimiter inserted between message. Default : ``\n``. Must be encoded in url (eg ``%0A`` for ``\n``). Can be empty.


AMQP
---
This plugin is used to send logs to an [AMQP exchange](https://www.rabbitmq.com/tutorials/amqp-concepts.html), like a [RabbitMQ](http://www.rabbitmq.com/) exchange. This plugin is compatible with the original AMQP logstash plugin.

Examples:

* Fanout mode: ``output://amqp://localhost:5672?exchange_name=toto`` : Receive message from fanout exchange ``toto``
* Topic mode: ``output://amqp://localhost:5672?exchange_name=toto_topic&topic=test`` : Receive message from topic ``test`` on  exchange ``toto_topic``

Parameters:

* ``topic``: Optional. Topic to use in topic mode. Default : none, fanout mode is used.
* ``durable``: Optional. Set exchange durability. Default : true.
* ``retry_delay``: Optional. Retry delay (in ms) to connect AMQP broker. Default : 3000.
* ``heartbeat``: Optional. AMQP heartbeat in s. Default: 10
* ``type``: Optional. To specify the log type, to faciliate crawling in kibana. Example: ``type=rabbit``. No default value.
* ``ssl``: enable SSL mode. See below for SSL parameters. Default : false
* ``serializer``: Optional. Please see above. Default value to ``json_logstash``.

Filters
===

Regex
---

The regex filter is used to extract data from lines of logs. The lines of logs are not modified by this filter.

Example 1: ``filter://regex://?regex=^(\S)+ &fields=toto``, to extract the first word of a line of logs, and place it into the ``toto`` field.

Example 2: ``filter://regex://http_combined?only_type=nginx``, to extract fields following configuration into the http_combined pattern. node-logstash is bundled with [some configurations](https://github.com/bpaquet/node-logstash/tree/master/lib/patterns). You can add your custom patterns directories, see options ``--patterns_directories``.

Example 3: ``filter://regex://?regex=(\d+|-)&fields=a&numerical_fields=a``, to force number extraction. If the macthed string is not a number but ``-``, the field ``a`` will not be set.

Parameters:

* ``regex``: regex to apply.
* ``regex_flags``: regex flags (eg : g, i, m).
* ``fields``: name of fields which will receive the pattern extracted (see below for the special field @timestamp).
* ``numerical_fields``: name of fields which have to contain a numerical value. If value is not numerical, field will not be set.
* ``date_format``: if ``date_format`` is specified and a ``@timestamp`` field is extracted, the filter will process the data extracted with the date\_format, using [moment](http://momentjs.com/docs/#/parsing/string-format/). The result will replace the original timestamp of the log line.

Note: fields with empty values will not be set.

Grok
---

The grok filter is used to extract data using [grok patterns](http://logstash.net/docs/latest/filters/grok). The lines of logs are not modified by this filter.

Grok is a simple pattern defining language. The syntax for a grok pattern is ``%{SYNTAX:SEMANTIC}``.

The ``SYNTAX`` is the name of the pattern that will match the text.

The ``SEMANTIC`` is the field name to assign the value of the matched text.

Grok rides on the Origuruma regular expressions library, so any valid regular expression in that syntax is valid for grok.
You can find the fully supported syntax on the [Origuruma site](http://www.geocities.jp/kosako3/oniguruma/doc/RE.txt).

The grok filter has many built-in grok patterns. The full list can be found in the [patterns folder](lib/patterns/grok).
(Note: patterns were copied from [elasticsearch/patterns](https://github.com/elasticsearch/logstash/tree/master/patterns)).

Example 1: ``filter://grok://?grok=%{WORD:w1} %{NUMBER:num1}``, on an input of ``hello 123`` will add the field ``w1`` with value ``hello`` and field ``num1`` with value ``123``.

Example 2: ``filter://grok://only_type=haproxy&grok=%{HAPROXYHTTP}``, to extract fields from a haproxy log. The ``HAPROXYHTTP`` pattern is already built-in to the grok filter.

Example 3: ``filter://grok://?extra_patterns_file=/path/to/file&grok=%{MY_PATTERN}``, to load custom patterns from the ``/path/to/file`` file that defines the ``MY_PATTERN`` pattern.

Parameters:

* ``grok``: the grok pattern to apply.
* ``extra_patterns_file``: path to a file containing custom patterns to load.
* ``numerical_fields``: name of fields which have to contain a numerical value. If value is not numerical, field will not be set.
* ``date_format``: if ``date_format`` is specified and a ``@timestamp`` field is extracted, the filter will process the data extracted with the date\_format, using [moment](http://momentjs.com/docs/#/parsing/string-format/). The result will replace the original timestamp of the log line.

Note: fields with empty values will not be set.

Mutate replace
---

The mutate replace filter is used to run regex on specified field.

Example: ``filter://mutate_replace?toto&from=\\.&to=-`` replace all ``.`` in ``toto`` field by ``-``

Parameters:

* ``from``: regex to find pattern which will be replaced. You have to escape special characters.
* ``to``: replacement string.

Grep
---

The grep filter can remove lines which match or do not match a given regex.

Example 1: ``filter://grep://?regex=abc`` remove all lines which do not contain ``abc``. Equivalent to ``grep`

Example 2: ``filter://grep://?regex=abc&invert=true`` remove all lines which contain ``abc``. Equivalent to ``grep -v``

Example 3: ``filter://grep://?type=nginx&regex=abc`` remove all lines with type ``nginx`` which do not contain ``abc`` and

Parameters:

* ``regex``: regex to be matched. You have to escape special characters.
* ``regex_flags: regex flags (eg : g, i, m).
* ``invert``: if ``true``, remove lines which match. Default value: false.

Reverse DNS
---

The reverse dns filter replace an ip in a field by the hostname, performing a dns resolution. This is useful with syslog.

Example 1: ``filter://reverse_dns://host`` performs a dns resolution on the field ``host``.

Parameters:

* ``target_field``: field to store the result. Default: field used for resolution.
* ``only_hostname``: after dns resolution, the filter will keep only the first word of dns name. Example : 'www.free.fr' will be transformed to 'www'. Default value: true

Compute field
---

The compute field filter is used to add a new field to a line, with a fixed value, or with a value computed from other fields.

Example 1: ``filter://compute_field://toto?value=abc`` add a field named ``toto`` with value ``abc``

Example 2: ``filter://compute_field://toto?value=abc#{titi}`` add a field named ``toto`` with value ``abcef``, if line contain a field ``titi`` with value ``ef``

Parameters:

* ``value``: value to be placed in the given field.

Compute date field
---

The compute date field filter is used to compute a date field from ``timestamp``field, using using [moment](http://momentjs.com/docs/#/parsing/string-format/) date format.

Example 1: ``filter://compute_date_field://toto?date_format=DD/MMMM/YYYY`` add a field named ``toto``, containing timestamp formated with ``DD/MMMM/YYYY``

Parameters:

* ``date_format``: date format string, using [moment](http://momentjs.com/docs/#/parsing/string-format/)

Split
---

The split filter is used to split a line of log into multiple lines, on a given delimiter.

Example 1: ``filter://split://?delimiter=|`` split all lines of logs on ``|`` char. You have to url encode special chars (%0A for ``\n``).

Parameters:

* ``delimiter``: delimiter used to split.

Multiline
---

The multiline filter is used to regroup lines into blocks. For example, you can group lines from a Java stacktrace into single line of log. To do that, you have to provide a regular expression which match the first line of each block. Standard way is to detect a timestamp.

Example 1: ``filter://multiline://?start_line_regex=^\\d{4}-\\d{2}-\\d{2}`` will regroup lines by blocks, each block have to start with a line with a date like ``2012-12-02``

Parameters:

* ``start_line_regex``: regular expression which is used to find lines which start blocks. You have to escape special characters.
* ``regex_flags: regex flags (eg : g, i, m).
* ``max_delay``: delay to wait the end of a block. Default value: 50 ms. Softwares which write logs by block usually write blocks in one time, this parameter is used to send lines without waiting the next matching start line.

Json Fields
---

The json fields filter is used to parse the message payload as a JSON object, and merge it into current object.

This allows to automatically index fields for messages that already contain a well-formatted JSON payload. The JSON object is parsed starting from the first ``{`` character found in the message.

Filter does nothing in case of error while parsing the message. Existing attributes in current line are kept, but overwritten if they conflict with attributes from the parsed payload.

Example 1: ``filter://json_fields://?only_type=json_stream`` will parse, as JSON, the given stream of messages which ``type`` matches ``json_stream``.

Geoip
---

The geoip filter is used to perform a geoip lookup from a given field, and store teh result into current object.

After installing, to update the geoip database from maxmind, go to `node_modules/geoip-lite/` and execute `npm run-script updatedb`.

The reverse dns filter can be used before geop filter to resolve hostname.

Example 1: ``filter://geoip://ip`` will lookup for ``ip`` field in the geoip database. The resulting object will contains following fields: ``ip_geo_country``, ``ip_geo_region``, ``ip_geo_city``, ``ip_geo_lonlat``, filled with geoip lookup result.

Parameters:

* ``country_field``: field in which to store the geo ip country result. Default value : ``ip_geo_country``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip country result will not be stored.
* ``region_field``: field in which to store the geo ip region result. Default value : ``ip_geo_region``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip region result will not be stored.
* ``city_field``: field in which to store the geo ip city result. Default value : ``ip_geo_city``, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip city result will not be stored.
* ``lonlat_field``: field in which to store the geo ip longitude and latitude result. Default value : ``ip_geo_lonlat`, if the field containing the ip is ``ip``. If you specify ``none``, the geo ip longitude and latitude result will not be stored.

Eval
---

The eval filter is used to process a field with javascript code.

Example 1: ``filter://eval://delay?operation=x*1000`` multiply the value of field ``delay`` by 1000.
Example 2: ``filter://eval://toto?operation=x+%22a%22`` add ``a`` character to the field ``toto``.

Parameters:

* ``operation``: javascript code to execute. The input field is in the ``x`` variable.
* ``target_field``: field to store the result. Default : source field.

Bunyan
---

The bunyan filter parse the [bunyan log format](https://github.com/trentm/node-bunyan).

Example: ``filter://bunyan://?only_type=toto`` parse the logs with type toto, using the bunyan log format.

HTTP Status classifier
---

The http status classifier filter parse the status code.

Example: ``filter://http_status_classifier://http_status`` parse the ``http_status`` field and fill the ``http_class`` field with value like ``2xx``, ``3xx``.

Parameters:
* ``target_field``: field to store the result. Default : ``http_class``.
* ``special_codes``: http status codes to be kept as is. Eg, with ``498,499`` value in ``special_codes``, the filter will put 499 in the ``http_class`` field when receiving a ``499`` http code, and not ``4xx``. Mutlipe values must be separated with ``,``. Default value: empty.

Misc
===

SSL Params
---

When you are in SSL mode (client or server), you can use [all the parameters using by node for SSL / TLS](http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener), prefixed by ``ssl_``.
You have to give path for certificate and key params, node-logstash will load them before initializing SSL / TLS stack.

For example, for a HTTPS server : ``ssl=true&ssl_cert=/path/to/cert&ssl_key=/path/to/key``

For using a Certificate authority, add ``&ssl_ca=/path/to/ca``.

For changing SSL ciphers, add ``ssl_ciphers=AES128-GCM-SHA256``.

To use a client certificate, add ``ssl_cert=/client.cer&ssl_key=/client.key&ssl_ca=/tmp/ca.key``.

To ignore ssl errors, add ``ssl_rejectUnauthorized=false`.

HTTP Proxy
---

The proxy parameter allow to use an http proxy.

The proxy url must have the format ``http[s]://[userinfo@]hostname[:port]`` which gives support for:
  * http and https proxies
  * proxy authentication via userinfo ``username:password`` in plain text or in base64 encoding (i.e. ``dXNlcm5hbWU6cGFzc3dvcmQ=``)
  * proxy port
  * NTLM : for ntlm authent, userinfo have to be ``ntlm:domain:hostname:username:password``. Hostname can be empty.

Force fields typing in ElasticSearch
---

If you have a custom field with an hashcode
- if the first hashcode of the day contains only digits, ElasticSearch will guess the field type and will choose integer and it will fail to index the next values that contains letters.
- by default ElasticSearch will tokenize it like some real text instead of treating it like a blob, it won't impact tools like kibana but may prevent you from doing custom queries.

For both cases you should add a `default-mapping.json` file in ElasticSearch config directory :

```json
{
  "_default_": {
    "properties": {
      "my_hash_field": {
        "type" : "string",
        "index" : "not_analyzed"
      }
    }
  }
}
```

License
===

Copyright 2012 - 2014 Bertrand Paquet

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
