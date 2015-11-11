Redis output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to sent data on a Redis channel.

They are two method to send message from redis :
* Publish / subscribe : The ``publsh`` redis command will be used. ``channel` parameter is needed.
* Queue. This ``rpush`` redis command will be used. ``key`` parameter is needed.

Example:
Config using url: ``output://redis://localhost:6379?channel=logstash_channel``

Config using logstash format:
````
input {
  redis {
    host => localhost
    port => 6379
    channel => logstash_channel
  }
}
````

Parameters:

* ``host``: ip of the redis server.
* ``port``: port of the redis server.
* ``auth_pass``: password to use when connecting to Redis
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=app_name_log``.
* ``method``: ``pubsub`` or ``queue``. Method to use for redis messaging.
* ``channel``: Channel for publish / subscribe. No default value.
* ``key``: Queue name for queue. No default value.
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
