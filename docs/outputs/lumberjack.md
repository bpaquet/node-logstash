Lumberjack output plugin
---

Status : core plugin, maintained.


This plugin is used to sent data to logstash server, using lumberjack protocol.
The connection must be secured with TLS.

Example:
Config using url: ``output://lumberjack://localhost:5044?ca=ca.crt``

Config using logstash format:
````
output {
  lumberjack {
    host => localhost
    port => 5044
    ca => "ca.crt"
  }
}
````

Parameters:

* ``host``: ip of the logstash server.
* ``port``: port of the logstash server.
* ``ssl_ca``, ``ssl_key``, ``ssl_cert``, ``ssl_rejectUnauthorized``: TLS params. More doc at [ssl](../ssl.md).
* ``max_queue_size``: number of message to store in memory before dropping. Default: 500.
