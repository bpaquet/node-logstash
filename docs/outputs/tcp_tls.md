TCP / TLS output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log clients to send data over TCP, optionnaly with SSL/TLS encryption.

Example 1: TCP mode:
Config using url: ``output://tcp://192.168.1.1:12345``

Config using logstash format:
````
output {
  tcp {
    host => 192.168.1.1
    port => 12345
  }
}
````

Example 2: SSL mode:
Config using url: ``output://tcp://192.168.1.1:443?ssl=true&ssl_key=/etc/ssl/private/logstash-client.key&ssl_cert=/etc/ssl/private/logstash-client.crt&ssl_rejectUnauthorized=true``
````
output {
  tcp {
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

* ``host``: ip of the tcp server.
* ``port``: port of the tcp server.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
* ``delimiter``: Optional. Delimiter inserted between message. Default : ``\n``. Must be encoded in url (eg ``%0A`` for ``\n``). Can be empty.
