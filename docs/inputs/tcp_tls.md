TCP / TLS input plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log server to receive data over TCP, optionnaly with SSL/TLS encryption.

Example 1: TCP mode:
Config using url: ``input://tcp://0.0.0.0:12345``

Config using logstash format:
````
input {
  tcp {
    host => 0.0.0.0
    port => 12345
  }
}
````

Example 2: SSL mode:
Config using url: ``input://tcp://0.0.0.0:443?ssl=true&ssl_key=/etc/ssl/private/logstash-server.key&ssl_cert=/etc/ssl/private/logstash-server.crt&ssl_requestCert=true&ssl_rejectUnauthorized=true``

Config using logstash format:
````
input {
  tcp {
    host => 0.0.0.0
    port => 12345
    ssl => true
    ssl_key => "/etc/ssl/private/logstash-server.key"
    ssl_cert => "/etc/ssl/private/logstash-server.crt"
    ssl_requestCert => true
    ssl_rejectUnauthorized => true
  }
}
````

Parameters:

* ``host``: listen address for the tcp server : can be 0.0.0.0, 127.0.0.1 ...
* ``port``: port for the tcp server.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``appendPeerCert``: in SSL mode, adds details of the peer certificate to the @tls field if the peer certificate was received from the client using requestCert option. Default: true in SSL mode
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=tls``. No default value.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.
