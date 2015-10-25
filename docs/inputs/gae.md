Google App Engine
---

Status : core plugin, fully tested.

This plugin is used to collect logs from a running Google App Engine Application.

You have to add a servlet in your App Engine App (see below). The plugin will poll the logs from this servlet.

This plugin collects logs 10s in the past to allow GAE internal logs propagation.

Examples:

* ``input://gae://myapp.appspot.com:80?key=toto``. Will grab the logs from myapp GAE app, every minutes, on url ``http://myapp.appspot.com:80/logs?log_key=toto``

Parameters:

* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=mygaeappp``. No default value.
* ``key``. the security key which will be sent in the http query to Google App Engine.
* ``ssl``: use ssl for grabbing logs. Use port 443 in this case. Default : false.
* ``polling``: polling delay. Default: 60s.
* ``servlet_name``: name of the servlet which serve logs. Default : ``logs``.
* ``access_logs_field_name`` and ``access_logs_type``. If the received line of log has a field ``access_logs_field_name``, the plugin will set the type of the line to ``access_logs_type``. It's used to differentiate access logs from application logs, to apply specific filter on access_logs. Standard config is : ``access_logs_type=nginx_access_logs&access_logs_field_name=http_method``. No default value.

