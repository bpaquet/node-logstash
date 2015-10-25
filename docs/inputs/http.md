HTTP input plugin
---

Status : core plugin, fully tested.

This plugin is used on log server to receive logs from an HTTP/HTTPS stream. This is useful
in case the agent can only output logs through an HTTP/HTTPS channel.

Example:

* ``input://http://localhost:8080``

Parameters:

* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=http``. No default value.
* ``unserializer``: please see please see [unserializer](unserializers.md). Default value to ``json_logstash``.
* ``ssl``: enable SSL mode. Please see please see [ssl](../ssl.md). Default : false
