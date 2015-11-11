AMQP output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to send logs to an [AMQP exchange](https://www.rabbitmq.com/tutorials/amqp-concepts.html), like a [RabbitMQ](http://www.rabbitmq.com/) exchange. This plugin is compatible with the original AMQP logstash plugin.

Examples:

* Fanout mode: Receive message from fanout exchange ``toto``
Config using url: ``output://amqp://localhost:5672?exchange_name=toto``

Config using logstash format:
````
output {
  amqp {
    host => localhost
    port => 5672
    exchange_name => toto
  }
}
````

* Topic mode: Receive message from topic ``test`` on  exchange ``toto_topic``
Config using url: ``output://amqp://localhost:5672?exchange_name=toto_topic&topic=test``

Config using logstash format:
````
output {
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
* ``topic``: Optional. Topic to use in topic mode. Default : none, fanout mode is used.
* ``durable``: Optional. Set exchange durability. Default : true.
* ``persistent``: Optional. Set persistent flag on each send message. Default: false.
* ``retry_delay``: Optional. Retry delay (in ms) to connect AMQP broker. Default : 3000.
* ``heartbeat``: Optional. AMQP heartbeat in s. Default: 10
* ``username``: username for PLAIN authentication to amqp broker. No default value.
* ``password``: password for PLAIN authentication to amqp broker. No default value.
* ``vhost``: amqp vhost to use. No default value.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
