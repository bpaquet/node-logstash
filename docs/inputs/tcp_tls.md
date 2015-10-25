TCP / TLS input plugin
---

Status : core plugin, fully tested.

This plugin is used on log server to receive data over TCP, optionnaly with SSL/TLS encryption.

Examples:

* TCP mode: ``input://tcp://0.0.0.0:12345``
* SSL mode: ``input://tcp://0.0.0.0:443?ssl=true&ssl_key=/etc/ssl/private/logstash-server.key&ssl_cert=/etc/ssl/private/logstash-server.crt&ssl_requestCert=true&ssl_rejectUnauthorized=true``

Parameters:

* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``appendPeerCert``: in SSL mode, adds details of the peer certificate to the @tls field if the peer certificate was received from the client using requestCert option. Default: true in SSL mode
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=tls``. No default value.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.
