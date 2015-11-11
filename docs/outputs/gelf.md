Gelf output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to send data to a GELF enabled server, eg [Graylog2](http://graylog2.org/). Documentation of GELF messages is [here](https://github.com/Graylog2/graylog2-docs/wiki/GELF).

Example: to send logs to 192.168.1.1 port 1221.
Config using url: ``output://gelf://192.168.1.1:12201``

Config using logstash format:
````
output {
  gelf {
    host => 192.168.1.1
    port => 12201
  }
}
````

Parameters:

* ``host``: ip of the gelf server.
* ``port``: port of the gelf server.
* ``message``: ``short_message`` field. Default value: ``#{message}``, the line of log. Can reference log line properties (see [interpolation](../interpolation.md)).
* ``facility``: ``facility`` field. Default value: ``#{type}``, the line type. ``no_facility`` if no value. Can reference log line properties (see [interpolation](../interpolation.md)).
* ``level``: ``level`` field. Default value: ``6``. Can reference log line properties (see [interpolation](../interpolation.md)).
* ``version``: ``version`` field. Default value: ``1.0``.
