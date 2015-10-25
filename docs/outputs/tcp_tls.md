TCP / TLS output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log clients to send data over TCP, optionnaly with SSL/TLS encryption.

Example:

* TCP mode:  ``output://tcp://192.168.1.1:12345``
* SSL Mode: ``output://tcp://192.168.1.1:443?ssl=true&ssl_key=/etc/ssl/private/logstash-client.key&ssl_cert=/etc/ssl/private/logstash-client.crt&ssl_rejectUnauthorized=true``

Parameters:

* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
* ``delimiter``: Optional. Delimiter inserted between message. Default : ``\n``. Must be encoded in url (eg ``%0A`` for ``\n``). Can be empty.
