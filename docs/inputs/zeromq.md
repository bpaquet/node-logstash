ZeroMQ input plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log server to receive logs from agents.

Example 1: to open a zeromq socket on port 5555.
Config using url: ``input://zeromq://tcp://0.0.0.0:5555``

Config using logstash format:
````
input {
  zeromq {
    address => ['tcp://0.0.0.0:5555']
  }
}
````

Parameters :
* ``address``: array of ZeroMQ url to open.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``. This plugin does not support raw data.
