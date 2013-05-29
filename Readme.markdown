node-logstash
====

What is it ?
---

It's a [NodeJS](http://nodejs.org) implementation of [Logstash](http://logstash.net/).


What to do with node-logstash ?
---

node-logstash is a tool to collect logs on servers. It allow to send its to a central server and to [elastic search](http://www.elasticsearch.org/) for indexing.

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

How it's works ?
===

The architecture is identical to logstash architecture. You have to instanciates plugins with the node-logstash core. There are three type of modules:

* [inputs plugins](https://github.com/bpaquet/node-logstash/tree/master/lib/inputs): where datas come into node-logstash. Examples: file, zeromq transport layer
* [filter plugins](https://github.com/bpaquet/node-logstash/tree/master/lib/filters): extract fields from logs, like timestamps. Example: regex plugin
* [outputs plugins](https://github.com/bpaquet/node-logstash/tree/master/lib/outputs): where datas leave from node-logstash: Examples: elastic search , zeromq transport layer.


A typical node-logstash deployement contains agents to crawl logs and a log server.

On agent, node-logstash is configured whith inputs plugins to get logs from your software stack, and one output plugin to send logs to log server (eg. zeromq output plugin).

On log server, logs come trough a zeromq input plugin, are processed (fields and timestamps extraction), and send to elastic search.

How to use it ?
===

Installation
---

* Install NodeJS, version > 0.8.
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
* ``--log_file`` to redirect log to a log file
* ``--patterns_directories`` to add some directories (separated by ,), for loading config for regex plugin
* ``--db_file`` to specify the file to use as database for file inputs (see below)
* ``--http_max_sockets`` to specify the max sockets of [http.globalAgent.maxSockets](http://nodejs.org/api/http.html#http_agent_maxsockets). Default to 100.

Examples
---

Config file for an agent:

    input://file:///var/log/nginx/access.log
    output://zeromq://tcp://log_server:5555

Config file for log server:

    input://zeromq://tcp://0.0.0.0:5555
    filter://regex://http_combined
    output://elasticsearch://localhost:9001

Changelog
===

* Add serializer and unserializer support
* Allow to use input file plugin on non existent directory

0.0.2
---

* Add redis input and output plugin
* Add tail -f input file plugin

Inputs plugins
===

Unserializers :

Some inputs plugins supports the ``unserializer`` params.
Supported unserializer for input plugin :

* ``json_logstash``: the unserializer try to parse data as a json object. If fail, raw data is returned. Some input plugins can not accept raw data.

File
---

This plugin monitor log files. It's compatible with logrotate. If a db file is specified, this plugin store where the last line were read when node-logstash stop. This value is used when node-logstash restart to read lines written node-logstash downtime.

Example: ``input://file:///tmp/toto.log``, to monitor ``/tmp/toto.log``.

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
parse timestamp, and will replace ``@source_host`` and ``@message`` field.

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

Example:

* ``input://redis://localhost:6379?channel=logstash_channel``

Parameters:

* ``channel``: Redis channel to subscribe/psubscribe to
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=redis``. No default value.
* ``pattern_channel``: use channel as pattern. Default value : false
* ``unserializer``: please see above. Default value to ``json_logstash``.

Outputs and filter, commons parameters
===

* ``only_type``: execute the filter / output plugin only on lines with specified type. Example: ``only_type=nginx``
* ``only_field_exist_toto``: execute the filter / output plugin only on lines with a field ``toto``. You can specify it multiple times, all fields have to exist.
* ``only_field_equal_toto=aaa``: execute the filter / output plugin only on lines with a field ``toto``, with value ``aaa``. You can specify it multiple times, all fields have to exist and have the specified value.

Access to line log properties
===

Some params are string, which can reference line log properties:

* ``#{@message}`` will contain the full log line
* ``#{@type}`` will contain the type of log line
* ``#{toto}`` will contain the value of the field ``toto``, which have to be extracted with a regex filter
* ``2#{toto}`` will contain ``2`` followed by the value of the field ``toto``.

Ouputs plugins
===

Serializer :

Some outputs plugins support the ``serializer`` params.
Supported serializer for output plugin :

* ``json_logstash``: this serializer dumps the log line to a JSON Object.
* ``raw``: this serializer dumps the log line to a string, given in the ``format`` parameter. The ``format`` string can reference log lines properties (see above). Default ``format`` value is ``#{message}``.

ZeroMQ
---

This plugin is used on agents to send logs to logs servers.

Example: ``output://zeromq://tcp://192.168.1.1:5555``, to send logs to 192.168.1.1 port 5555.

Parameters:

* ``serializer``: please see above. Default value to ``json_logstash``.
* ``format``: please see above. Used by the ``raw``serializer.

Elastic search
---

This plugin is used on log server to send logs to elastic search, using HTTP REST interface.

Example: ``output://elasticsearch://localhost:9001`` to send to the HTTP interface of an elastic search server listening on port 9001.

Elastic search ZeroMQ
---

This plugin is used on log server to send logs to elastic search, using ZeroMQ transport.
You can find the ZeroMQ transport here: https://github.com/bpaquet/transport-zeromq.

Example: ``output://elasticsearch_zeromq://tcp://localhost:9700`` to send to the zeromq transport of an elastic search server listening on port 9700.

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

* ``message``: ``short_message`` field. Default value: ``#{@message}``, the line of log. Can reference log line properties (see above).
* ``facility``: ``facility`` field. Default value: ``#{@type}``, the line type. ``no_facility`` if no value. Can reference log line properties (see above).
* ``level``: ``level`` field. Default value: ``6``. Can reference log line properties (see above).
* ``version``: ``version`` field. Default value: ``1.0``.

File
---

This plugin is used to write data into files. There are two modes: JSON, and raw (default).

In JSON mode, each line of log is dumped to target file as JSON object, containing all fields.

In raw mode, each line of log is dumped to target file as specified in ``format`` parameter. Default format is ``#{@message}``, which means the original log line.

Note: target files can be reopened by sending USR signal to node-logstash.

Example 1: ``output://file:///var/log/toto.log?only_type=nginx``, to write each ``nginx`` log lines to ``/var/log/toto.log``.

Parameters:

* ``serializer``: please see above. Default value to ``raw``.
* ``format``: please see above. Used by the ``raw``serializer.

HTTP Post
---

This plugin is used to send data to an HTTP server, with a POST request. For filling request body, there are two modes: JSON, and raw (default).

In JSON mode, the HTTP POST body request will contain a JSON dump of log line, containing all fields. Content-Type will be set to ``text/plain``.

In raw mode, the HTTP POST body request will contain the log line. Content-Type will be set to ``application/json``.

Example 1: Send data to [Loggly](http://loggly.com/): ``output://http_post://logs.loggly.com:80?path=/inputs/YOUR_INPUT_KEY``

Parameters:

* ``path``: path to use in the HTTP request. Can reference log line properties (see above).
* ``proto``: ``http`` or ``https``. Default value: ``http``.
* ``serializer``: please see above. Default value to ``json_logstash``.
* ``format``: please see above. Used by the ``raw``serializer.

Redis
---

This plugin is used to sent data on a Redis channel.

Example:

* ``output://redis://localhost:6379?channel=logstash_channel``

Parameters:

* ``channel``: Redis channel to subscribe/psubscribe to
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=app_name_log``.
* ``pattern_channel``: use channel as pattern. Default value : false
* ``serializer``: please see above. Default value to ``json_logstash``.
* ``format``: please see above. Used by the ``raw``serializer.

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
* ``fields``: name of fields which will receive the pattern extracted (see below for the special field @timestamp).
* ``numerical_fields``: name of fields which have to contain a numerical value. If value is not numerical, field will not be set.
* ``date_format``: if ``date_format` is specified and a ``@timestamp`` field is extracted, the filter will process the data extracted with the date\_format, using [moment](http://momentjs.com/docs/#/parsing/string-format/). The result will replace the original timestamp of the log line.

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
* ``invert``: if ``true``, remove lines which match. Default value: false.

Reverse DNS
---

The reverse dns filter replace an ip in `@source_host` by the hostname, performing a dns resolution. This is useful with syslog.

Example 1: ``filter://reverse_dns://`` 

Parameters:

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

The compute date field filter is used to compute a date field from ``@timestamp``field, using using [moment](http://momentjs.com/docs/#/parsing/string-format/) date format.

Example 1: ``filter://compute_date_field://toto?date_format=DD/MMMM/YYYY`` add a field named ``toto``, containing timestamp formated with ``DD/MMMM/YYYY``

Parameters:

* ``date_format``: date format string, using [moment](http://momentjs.com/docs/#/parsing/string-format/)

Split
---

The split filter is used to split a line of log into multiple lines, on a given delimiter.

Example 1: ``filter://split://?delimiter=|`` split all lines of logs on ``|`` char.

Parameters:

* ``delimiter``: delimiter used to split.

Multiline
---

The multiline filter is used to regroup lines into blocks. For example, you can group lines from a Java stacktrace into single line of log. To do that, you have to provide a regular expression which match the first line of each block. Standard way is to detect a timestamp.

Example 1: ``filter://multiline?start_line_regex=^\\d{4}-\\d{2}-\\d{2}`` will regroup lines by blocks, each block have to start with a line with a date like ``2012-12-02``

Parameters:

* ``start_line_regex``: egular expression which is used to find lines which start blocks. You have to escape special characters.
* ``max_delay``: delay to wait the end of a block. Default value: 50 ms. Softwares which write logs by block usually write blocks in one time, this parameter is used to send lines without waiting the next matching start line.

Json Fields
---

The json fields filter is used to parse the message payload as a JSON object, and merge it to the ``@fields`` attribute.

This allows to automatically index fields for messages that already contain a well-formatted JSON payload. The JSON object is parsed starting from the first ``{`` character found in the message. 

Filter does nothing in case of error while parsing the message. Existing attributes in ``@fields`` are kept, but overwritten if they conflict with attributes from the parsed payload.

Example 1: ``filter://json_fields://?only_type=json_stream`` will parse, as JSON, the given stream of messages which ``@type`` matches ``json_stream``, and fill the ``@fields`` attribute using the messages content.

Misc
===

Force fields typing in Elastic Search
---

If you have a custom field with an hashcode
- if the first hashcode of the day contains only digits, Elastic Search will guess the field type and will choose integer and it will fail to index the next values that contains letters.
- by default elastic search will tokenize it like some real text instead of treating it like a blob, it won't impact tools like kibana but may prevent you from doing custom queries.

For both cases you should add a `default-mapping.json` file in Elastic Search config directory :

```json
{
  "_default_": {
    "properties": {
      "@fields": {
        "properties": {
          "my_hash_field": {
            "type" : "string",
            "index" : "not_analyzed"
          }
        }
      }
    }
  }
}
```

License
===

Copyright 2012 - 2013 Bertrand Paquet

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.