File input plugin
---

Status : core plugin, fully tested.

This plugin monitor log files.

Wildcard (* and ?) can be used, in path, and basename.

This plugin is compatible with logrotate.

If a db file is specified on node-logstash command line (``--db_file``), this plugin stores the last line read for each file, to allow restart at the same place, even the monitored file grows when node-logstash were down.

Example:
* ``input://file:///tmp/toto.log``, to monitor ``/tmp/toto.log``.
* ``input://file:///var/log/*.log``, to monitor all log file in ``/var/log``.
* ``input://file:///var/log/httpd/*/access.log``, to monitor all log ``access.log`` files in directories ``/var/log/httpd/*``.
* ``input://file:///var/log/auth%3F.log``, to monitor all files matching ``auth?.log`` in ``/var/log``. ``%3F`` is the encoding of ``?``.

Parameters:

* ``start_index``: add ``?start_index=0`` to reread files from begining. Without this params, only new lines are read.
* ``use_tail``: use system ``tail -f`` command to monitor file, instead of built in file monitoring. Should be used with logrotate and copytuncate option. Defaut value: false.
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=nginx_error_log``.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.

Note: this plugin can be used on FIFO pipes.
