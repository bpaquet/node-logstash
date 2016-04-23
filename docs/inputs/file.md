File input plugin
---

Status : core plugin, unit tested and maintained.

This plugin monitor log files.

Wildcard (* and ?) can be used, in path, and basename.

This plugin is compatible with logrotate (copytruncate or normal mode).

If a db file is specified on node-logstash command line (``--db_file``), this plugin stores the last line read for each file, to allow restart at the same place, even the monitored file grows when node-logstash were down.

Example 1: to monitor ``/tmp/toto.log``
Config using url: ``input://file:///tmp/toto.log``

Config using logstash format:
````
input {
  file {
    path => "/tmp/toto.log"
  }
}
````

Example 2: to monitor all log file in ``/var/log``.
Config using url: ``input://file:///var/log/*.log``

Config using logstash format:
````
input {
  file {
    path => "/var/log/*.log"
  }
}
````

Example 3: to monitor all log ``access.log`` files in directories ``/var/log/httpd/*``.
Config using url: ``input://file:///var/log/httpd/*/access.log``

Config using logstash format:
````
input {
  file {
    path => "/var/log/httpd/*/access.log"
  }
}
````

Example 4: to monitor all files matching ``auth?.log`` in ``/var/log``.
Config using url: ``input://file:///var/log/auth%3F.log``. ``%3F`` is the encoding of ``?``.

Config using logstash format:
````
input {
  file {
    path => "/var/log/auth?.log"
  }
}
````

Parameters:

* ``path``: the path to monitor.
* ``start_index``: add ``?start_index=0`` to reread files from begining. Without this params, only new lines are read.
* ``use_tail``: use system ``tail -f`` command to monitor file, instead of built in file monitoring. Can be used when node-logstash is unable to follow files with strange rotation log behaviour (builtin in a sofware for example). Defaut value: false.
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=nginx_error_log``.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.

Note: this plugin can be used on FIFO pipes.
