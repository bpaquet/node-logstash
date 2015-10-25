Serializers for output plugins
---

Status : core feature, unit tested and maintained.

Some outputs plugins support the ``serializer`` params.
Supported serializer for output plugin :

* ``json_logstash``: this serializer dumps the log line to a JSON Object.
* ``msgpack``: this serializer dumps the log line to a [msgpack](http://msgpack.org) Object.
* ``raw``: this serializer dumps the log line to a string, given in the ``format`` parameter. The ``format`` string can reference log lines properties (see [interpolation](../interpolation.md)). Default ``format`` value is ``#{message}``.
