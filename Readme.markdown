node-logstash
====

[![Build Status](https://travis-ci.org/bpaquet/node-logstash.png)](https://travis-ci.org/bpaquet/node-logstash)

What is it ?
---

It's a [NodeJS](http://nodejs.org) implementation of [Logstash](http://logstash.net/).


What to do with node-logstash ?
---

node-logstash is a tool to collect logs on servers. It allow to send its to a central server and to [ElasticSearch](http://www.elasticsearch.org/) for indexing.

In top of elastic search, you can use a specialized interface like [kibana](https://github.com/elastic/kibana) to dive into your logs.

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

* Install NodeJS, version >= 0.12
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
instanciate an input file plugin which monitor the file ``/tmp/toto.log``.

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

[Changelog](changelog.md)

Plugins list
===

Input plugins
---

* [File](docs/inputs/file.md)
* [Syslog](docs/inputs/syslog.md)
* [ZeroMQ](docs/inputs/zeromq.md)
* [Redis](docs/inputs/redis.md)
* [HTTP](docs/inputs/http.md)
* [Websocket](docs/inputs/ws.md)
* [TCP / TLS](docs/inputs/tcp_tls.md)
* [Google app engine](docs/inputs/gae.md)
* [AMQP](docs/inputs/amqp.md)
* [SQS](docs/inputs/sqs.md)

Common concepts / parameters :

* [Unserializers](docs/inputs/unserializers.md)

Filter plugins
---

* [Regex](docs/filters/regex.md)
* [Grok](docs/filters/grok.md)
* [Mutate Replace](docs/filters/mutate_replace.md)
* [Grep](docs/filters/grep.md)
* [Reverse DNS](docs/filters/reverse_dns.md)
* [Compute field](docs/filters/compute_field.md)
* [Compute date field](docs/filters/compute_date_filed.md)
* [Split](docs/filters/split.md)
* [Truncate](docs/filters/truncate.md)
* [Multiline](docs/filters/multiline.md)
* [Json fields](docs/filters/json_fields.md)
* [Geoip](docs/filters/geoip.md)
* [Eval](docs/filters/eval.md)
* [Bunyan](docs/filters/bunyan.md)
* [HTTP Status Classifier](docs/filters/http_status_classifier.md)
* [Remove field when equal](docs/filters/remove_field_when_equal.md)

Common concepts / parameters :

* [Common parameters](docs/common_params.md)

Outputs
---

* [ZeroMQ](docs/outputs/zeromq.md)
* [ElasticSearch](docs/outputs/elasticsearch.md)
* [Statsd](docs/outputs/statsd)
* [Gelf](docs/outputs/gelf.md)
* [File](docs/outputs/file.md)
* [HTTP Post](docs/outputs/http_post.md)
* [Websocket](docs/outputs/ws.md)
* [Redis](docs/outputs/redis.md)
* [Logio](docs/outputs/logio.md)
* [TCP / TLS](docs/outputs/tcp_tls.md)
* [AMQP](docs/outputs/amqp.md)
* [SQS](docs/outputs/sqs.md)

Common concepts / parameters :

* [Common parameters](docs/common_params.md)
* [Serializers](docs/outputs/serializers.md)


Misc
---

* [Elasticsearch mapping](docs/elastic_mapping.md)

License
===

Copyright 2012 - 2014 Bertrand Paquet

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
