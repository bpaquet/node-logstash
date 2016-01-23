ZeroMQ output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on agents to ship to logs servers, or to send logs to [Elasticsearch Logstash River (ES < 2.0)](https://github.com/bpaquet/elasticsearch-river-zeromq) or to [Elasticsarch ZeroMQ torrent (ES >= 2.x)](https://github.com/bpaquet/elasticsearch-zeromq-torrent).

Example 1: to send logs to 192.168.1.1 port 5555.
Config using url: ``output://zeromq://tcp://192.168.1.1:5555``

Config using logstash format:
````
output {
  zeromq {
    address => ['tcp://192.168.1.1:5555']
  }
}
````

Example 2: to send logs to 192.168.1.1 and 192.168.1.1, using built in ZeroMQ load balancing feature.
Config using url: ``output://zeromq://tcp://192.168.1.1:5555,tcp://192.168.1.2:5555``

Config using logstash format:
````
output {
  zeromq {
    address => ['tcp://192.168.1.1:5555', 'tcp://192.168.1.2:5555']
  }
}
````

There are two queues in ZeroMQ output plugin :

* in the ZeroMQ library (see high watermark below). Default size: unlimited
* in the ZeroMQ NodeJS driver. Size is unlimited.

Parameters:

* ``address``: array of target ZeroMQ url.
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
* ``zmq_high_watermark``: set the high watermark param on [ZeroMQ socket](http://api.zeromq.org/2-1:zmq-setsockopt). Default : no value.
* ``zmq_threshold_up``: if the NodeJS driver queues size goes upper this threshold, node-losgstash will stop every inputs plugins to avoid memory exhaustion. Default : no value.
* ``zmq_threshold_down``: if the NodeJS driver queues size goes down this threshold and inputs plugins are stopped, node-losgstash will start every inputs plugins. Default : no value.
* ``zmq_check_interval``: if set, the plugin will check the NodeJS driver queue status to go out of alarm mode. Default : no value. Unit is milliseconds
