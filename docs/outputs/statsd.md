Statsd output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used send data to statsd.

Example: ``output://statsd://localhost:8125?only_type=nginx&metric_type=increment&metric_key=nginx.request``, to send, for each line of nginx log, a counter with value 1, key ``nginx.request``, on a statsd instance located on port 8125.

Parameters:

* ``metric_type``: one of ``increment``, ``decrement``, ``counter``, ``timer``, ``gauge``. Type of value to send to statsd.
* ``metric_key``: key to send to statsd.
* ``metric_value``: metric value to send to statsd. Mandatory for ``timer``, ``counter`` and ``gauge`` type.

``metric_key`` and ``metric_value`` can reference log line properties (see [interpolation](../interpolation.md)).

Example: ``metric_key=nginx.response.#{status}``
