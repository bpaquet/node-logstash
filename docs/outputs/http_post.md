HTTP Post output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to send data to an HTTP server, with a POST request. For filling request body, there are two modes: JSON, and raw (default).

In JSON mode, the HTTP POST body request will contain a JSON dump of log line, containing all fields. Content-Type will be set to ``text/plain``.

In raw mode, the HTTP POST body request will contain the log line. Content-Type will be set to ``application/json``.

Example 1: Send data to [Loggly](http://loggly.com/)
Config using url: ``output://http_post://logs.loggly.com:80?path=/inputs/YOUR_INPUT_KEY``

Config using logstash format:
````
output {
  http_post {
    host => logs.loggly.com
    port => 80
    path => "/inputs/YOUR_INPUT_KEY"
  }
}
````

Parameters:

* ``host``: ip of the target HTTP server.
* ``port``: port of the target HTTP server.
* ``path``: path to use in the HTTP request. Can reference log line properties (see [interpolation](../interpolation.md)).
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``raw``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``proxy``: use http proxy. More doc at [http proxy](http_proxy.md). Default : none.
* ``basic_auth_user`` and ``basic_auth_password``: user and password for HTTP Basic Auth required by server. Default: none.
