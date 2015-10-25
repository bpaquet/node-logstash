ZeroMQ input plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log server to receive logs from agents.

Example: ``input://zeromq://tcp://0.0.0.0:5555``, to open a zeromq socket on port 5555.

Parameters :
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``. This plugin does not support raw data.
