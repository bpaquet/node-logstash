Websocket output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log clients to send data over a websocket, optionally with SSL/TLS encryption. Websockets are like
TCP connections but they are proxy and firewall friendly.

Example 1: Regular mode:
Config using url: ``output://ws://192.168.1.1:12345``

Config using logstash format:
````
output {
  ws {
    host => 192.168.1.1
    port => 12345
  }
}
````

Example 2: TLS mode:
Config using url: ``output://ws://192.168.1.1:443?ssl=true&ssl_key=/etc/ssl/private/logstash-client.key&ssl_cert=/etc/ssl/private/logstash-client.crt&ssl_rejectUnauthorized=true``
````
output {
  ws {
    host => 192.168.1.1
    port => 12345
    ssl => true
    ssl_key => "/etc/ssl/private/logstash-client.key"
    ssl_cert => "/etc/ssl/private/logstash-client.crt"
    ssl_requestCert => true
    ssl_rejectUnauthorized => true
  }
}
````

Parameters:

* ``host``: ip of the ws server.
* ``port``: port of the ws server.
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``proxy``: use http proxy. More doc at [http proxy](http_proxy.md). Default : none.
* ``basic_auth_user`` and ``basic_auth_password``: user and password for HTTP Basic Auth required by server. Default: none.
