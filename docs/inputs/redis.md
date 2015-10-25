Redis input plugin
---

Status : core plugin, fully tested.

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
* ``unserializer``: please see please see [unserializer](unserializers.md). Default value to ``json_logstash``.
