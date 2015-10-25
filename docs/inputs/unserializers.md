Unserializers for input plugins
---

Status : core feature, unit tested and maintained.

Some inputs plugins supports the ``unserializer`` params.
Supported unserializer for input plugin :

* ``json_logstash``: the unserializer try to parse data as a json object. If fail, raw data is returned. Some input plugins can not accept raw data.
* ``msgpack``: the unserializer try to parse data as a [msgpack](http://msgpack.org) object. If fail, raw data is returned. Some input plugins can not accept raw data.
* ``raw``: the unserializer does not try to parse the input line. Best for performances.


