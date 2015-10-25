Logio output plugin
---

Status : core plugin, unit tested and maintained.


This plugin is used to sent data to a [Log.io](http://logio.org) server.

Example:

* ``output://logio://localhost:28777``

Parameters:

* ``priority`` to change the line priority. Can reference log line properties. Default value: ``info``.
* ``ssl``: enable SSL mode. More doc at [ssl](../ssl.md). Default : false
* ``proxy``: use http proxy. More doc at [http proxy](http_proxy.md). Default : none.
