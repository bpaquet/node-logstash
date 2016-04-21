File output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to write data into files. There are two modes: JSON, and raw (default). This plugin will create directory and sub directories if needed. Variables can be used in filename or in path.

In JSON mode, each line of log is dumped to target file as JSON object, containing all fields.

In raw mode, each line of log is dumped to target file as specified in ``format`` parameter. Default format is ``#{message}``, which means the original log line.

Note: target files can be reopened by sending USR2 signal to node-logstash.

Example 1: to write each ``nginx`` log lines to ``/var/log/toto.log``.
Config using url: ``output://file:///var/log/toto.log?only_type=nginx``

Config using logstash format:
````
output {
  if [type] == nginx {
    file {
      path => "/var/log/toto.log"
    }
  }
}
````

Example 2: to write each ``nginx`` log lines to ``/var/log/log_nginx.log``.
Config using url: ``output://file:///var/log/log_#{type}.log``

Config using logstash format:
````
output {
  file {
    path => "/var/log/log_#{type}.log"
  }
}
````

Example 3: to create a new directory for each month, and write to a file ``http.log``.
Config using url: ``output://file:///var/log/http/#{now:YYYY-MM}/http.log``

Config using logstash format:
````
output {
  file {
    path => "/var/log/http/#{now:YYYY-MM}/http.log"
  }
}
````

Parameters:

* ``path``: the target path.
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``raw``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
* ``delimiter``: Optional. Delimiter inserted between message. Default : ``\n``. Must be encoded in url (eg ``%0A`` for ``\n``). Can be empty.
* ``idle_timeout``: delay before closing a file without activity, in seconds. Set it to 0 to never close files. Why closing file ? Because you can use current date in filename, so node-logtash can close them automatically to avoid keeping useless files open). Default : 0.
* ``retry_delay``: after an error, delay before retry, in seconds. Default : 300.
