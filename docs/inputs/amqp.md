AMQP input plugin
---

Status : core plugin, fully tested.

This plugin is used to get logs from an [AMQP exchange](https://www.rabbitmq.com/tutorials/amqp-concepts.html), like a [RabbitMQ](http://www.rabbitmq.com/) exchange. This plugin is compatible with the original AMQP logstash plugin.

Examples:

* Fanout mode: ``input://amqp://localhost:5672?exchange_name=toto`` : Receive message from fanout exchange ``toto``
* Topic mode: ``input://amqp://localhost:5672?exchange_name=toto_topic&topic=test`` : Receive message from topic ``test`` on  exchange ``toto_topic``

Parameters:

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
