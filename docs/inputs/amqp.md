AMQP input plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to get logs from an [AMQP exchange](https://www.rabbitmq.com/tutorials/amqp-concepts.html), like a [RabbitMQ](http://www.rabbitmq.com/) exchange. This plugin is compatible with the original AMQP logstash plugin.

Example 1: Fanout mode: Receive message from fanout exchange ``toto``
Config using url: ``input://amqp://localhost:5672?exchange_name=toto``

Config using logstash format:
````
input {
  amqp {
    host => localhost
    port => 5672
    exchange_name => toto
  }
}
````

Example 2: Topic mode: Receive message from topic ``test`` on  exchange ``toto_topic``
Config using url: ``input://amqp://localhost:5672?exchange_name=toto_topic&topic=test``

Config using logstash format:
````
input {
  amqp {
    host => localhost
    port => 5672
    exchange_name => toto_topic
    topic => test
  }
}
````

Parameters:

* ``host``: ip of the AMQP broker.
* ``port``: port of the AMQP broker.
* ``topic``: topic to use in topic mode. Default : none, fanout mode is used.
* ``durable``: set exchange durability. Default : true.
* ``retry_delay``: retry delay (in ms) to connect AMQP broker. Default : 3000.
* ``heartbeat``: AMQP heartbeat in s. Default: 10
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=rabbit``. No default value.
* ``username``: username for PLAIN authentication to amqp broker. No default value.
* ``password``: password for PLAIN authentication to amqp broker. No default value.
* ``vhost``: amqp vhost to use. No default value.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.
