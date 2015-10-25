HTTP input plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log server to receive logs from an HTTP/HTTPS stream. This is useful
in case the agent can only output logs through an HTTP/HTTPS channel.

Example:

* ``input://http://localhost:8080``

Parameters:

* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=http``. No default value.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
