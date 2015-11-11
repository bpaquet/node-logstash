Websocket input plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log server to receive data over a websocket, optionally with SSL/TLS encryption. Websockets are like TCP, but are proxy and firewall friendly.

Example 1: Regular mode:
Config using url: ``input://ws://0.0.0.0:12345``

Config using logstash format:
````
input {
  ws {
    host => 0.0.0.0
    port => 12345
  }
}
````

Example 2: TLS mode:
Config using url: ``input://ws://0.0.0.0:443?ssl=true&ssl_key=/etc/ssl/private/logstash-server.key&ssl_cert=/etc/ssl/private/logstash-server.crt&ssl_requestCert=true&ssl_rejectUnauthorized=true``

Config using logstash format:
````
input {
  ws {
    host => 0.0.0.0
    port => 12345
    ssl => true
    ssl_key => /etc/ssl/private/logstash-server.key
    ssl_cert => /etc/ssl/private/logstash-server.crt
    ssl_requestCert => true
    ssl_rejectUnauthorized => true
  }
}
````

Parameters:

* ``host``: listen address for the ws server : can be 0.0.0.0, 127.0.0.1 ...
* ``port``: port for the ws server.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=tls``. No default value.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.