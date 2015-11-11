Logio output plugin
---

Status : core plugin, unit tested and maintained.


This plugin is used to sent data to a [Log.io](http://logio.org) server.

Example:
Config using url: ``output://logio://localhost:28777``

Config using logstash format:
````
output {
  logio {
    host => localhost
    port => 28777
  }
}
````

Parameters:

* ``host``: ip of the logio server.
* ``port``: port of the logio server.
* ``priority`` to change the line priority. Can reference log line properties. Default value: ``info``.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``proxy``: use http proxy. More doc at [http proxy](http_proxy.md). Default : none.
