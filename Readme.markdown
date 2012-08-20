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

When I tried logstash, I had some problems. This version should have :

* lower memory footprint
* lower cpu footprint
* faster startup delay

Moreover it's written in NodeJS, which is a perfect language for programs with many IO.

node-logstash is compatible with logstash. You can replace a node-logstash node by a logstash one. The data are formatted in the same way to be compatible with logstash UIs.

How it's work ?
===

The architecture is identical to logstash architecture. You have to instanciates plugins with the node-logstash core. There are three type of modules :

* [inputs plugin](https://github.com/bpaquet/node-logstash/tree/master/lib/inputs) : where datas come into node-logstash. Examples : file, zeromq transport layer
* [filter plugin](https://github.com/bpaquet/node-logstash/tree/master/lib/filters) : extract fields from logs, like timestamps. Example : regex plugin
* [outputs plugins](https://github.com/bpaquet/node-logstash/tree/master/lib/outputs) : where datas leave from node-logstash: Example : elastic search , zeromq transport layer.


A typical node-logstash deployement contains agents to crawl logs and a log server.

On agent, node-logstash is configured whith inputs plugins to get logs from your software stack, and one output plugin to send logs to log server (eg. zeromq output plugin).

On log server, logs come trough a zeromq input plugin, are processed (fields and timestamps extraction), and send to elastic search.

How to use it ?
===

Installation
---

* Install NodeJS, version > 0.8.
* Install node-logstash : ``npm install node-logstash`

The executable is in ``node_modules/node-logstash/bin/node-logstash-agent``
Configuration
---

Configuration is done by url. A plugin is instanciated by an url. Example : ``input://file:///tmp/toto.log``. This url
instanciate an input file plugin which monitor the file ``/tmp/toto.log`.

The urls can be specified :

* directly on the command line
* in a file (use the ``--config-file`` switch)
* in all files in a directory (use the ``--config-directory`` switch)

Others params :

* ``--log_level`` to change the log level (emergency, alert, critical, error, warning, notice, info, debug)
* ``--patterns_directories`` to add some directories (separated by ,), for loading config for regex plugin

Examples
---

Config file for an agent :

    input://file:///var/log/nginx/access.log
    output://zeromq://tcp://log_server:5555

Config file for log server :

    input://zeromq://tcp://0.0.0.0:5555
    filter://regex://?load_config=nginx_combined
    output://elasticsearch://localhost:9001

Inputs plugins
===

File
---

This plugin monitor log files. It's compatible with logrotate.

Example : ``input://file:///tmp/toto.log``, to monitor ``/tmp/toto.log``.

Params :
* ``start_index`` : add ``?start_index=0`` to reread files from begining. Without this params, only new lines are read.
* ``type`` : to specify the log type, to faciliate crawling in kibana

Zeromq
---

This plugin is used on log server to receive logs from agents.

Example : ``input://zeromq://tcp://0.0.0.0:5555``, to open a zeromq socket on port 5555.

Ouputs plugins
===

Zeromq
---

This plugin is used on agents to send logs to logs servers.

Example : ``output://zeromq://tcp://192.168.1.1:5555``, to send logs to 192.168.1.1 port 5555.

Elastic search
---

This plugin is used on log server to send logs to elastic search.

Example : ``output://elasticsearch://localhost:9001`` to send to the HTTP interface of an elastic search server listening on port 9001.

Filters
===

Regex
---

The regex filter is used to extract data from lines of logs. The lines of logs are not modified by this filter.

Example : ``filter://regex://?regex=^(\S)+ &fields=toto``, to extract the first word of a line of logs, and place it into the ``toto`` field.
Example 2 : ``filter://regex://nginx_combined?type=nginx``, to extract fields following configuration into the nginx_combined pattern. node-logstash is bundled with [some configurations](https://github.com/bpaquet/node-logstash/tree/master/lib/patterns). You can add your custom patterns directories, see options ``--patterns_directories``.

Params :

* regex : the regex to apply
* fields : the name of fields which wil receive the pattern extracted (see below for the special field timestamp)
* type : if this field is set, only the lines of logs with the same type will be processed by this filter.
* date_format : if date_format is specified and a ``timestamp`` field is extracted, the plugin will process the data extracted with the date_format, using [moment](http://momentjs.com/docs/#/parsing/string-format/). The result will replace the original timestamp of the log line.


