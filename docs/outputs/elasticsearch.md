ElasticSearch output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used on log server to ship to ElasticSearch, using HTTP REST interface.

By default, each incoming message generate one HTTP request to ElasticSearch. The bulk feature allows to send grouped messages. For example, under heavy traffic, you can send messages to ElasticSearch by bulk of 1000 messages. In this mode, the bulk is send even if incomplete after a configured timeout (100 ms by default).

Note : for better performance, you can use the ZeroMQ plugin and the [ZeroMQ Logasth river for ES < 2.0](https://github.com/bpaquet/elasticsearch-river-zeromq), or the [ElasticSearch ZeroMQ Torrent for ES >= 2.x](https://github.com/bpaquet/elasticsearch-zeromq-torrent).

Example 1: to send to the HTTP interface of an ElasticSearch server listening on port 9001.
Config using url: ``output://elasticsearch://localhost:9001``

Config using logstash format:
````
output {
  elasticsearch {
    host => localhost
    port => 9001
  }
}
````

Example 2: to send to index ``audit-<date>`` and type ``audits``.
Config using url: ``output://elasticsearch://localhost:9001&index_prefix=audit&data_type=audits``

Config using logstash format:
````
output {
  elasticsearch {
    host => localhost
    port => 9001
    index_prefix => audit
    data_type => audits
  }
}
````

Example 3: to perform bulk updates with a limit of 1000 messages per bulk update and a timeout of 100 ms to wait for 'limit' messages.
Config using url: ``output://elasticsearch://localhost:9001?bulk_limit=1000&bulk_timeout=100``

Config using logstash format:
````
output {
  elasticsearch {
    host => localhost
    port => 9001
    bulk_limit => 1000
    bulk_timeout => 100
  }
}
````

Parameters:
* ``host``: ip of the elasticsearch server.
* ``port``: port of the elasticsearch server.
* ``index_prefix``: specifies the index prefix that messages will be stored under. Default : ``logstash``. Default index will be ``logstash-<date>``
* ``index_name``: specifies a fixed name for the index that messages will be stored under. Disable the ``index_prefix`` option. No default value.
* ``data_type``: specifies the type under the index that messages will be stored under. (default is ``logs``)
* ``bulk_limit``: Enable bulk mode. Dpecifies the maximum number of messages to store in memory before bulking to ElasticSearch. No default value.
* ``bulk_timeout``: Specifies the maximum number of milliseconds to wait for ``bulk_limit`` messages,. Default is 100.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``proxy``: use http proxy. More doc at [http proxy](http_proxy.md). Default : none.
* ``basic_auth_user`` and ``basic_auth_password``: user and password for HTTP Basic Auth required by server. Default: none.
