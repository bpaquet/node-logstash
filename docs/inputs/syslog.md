Syslog input plugin
---

Status : core plugin, unit tested and maintained.

There is no syslog plugin, but it's easy to emulate with udp plugin.

Example:

* ``input://udp://0.0.0.0:514?type=syslog``
* ``filter://regex://syslog?only_type=syslog``
* ``filter://syslog_pri://?only_type=syslog``

The first filter will parse the syslog line, and extract ``syslog_priority``, ``syslog_program``, ``syslog_pid`` fields,
parse timestamp, and will replace ``host`` and ``message`` field.

The second filter will extract from ``syslog_priority`` field severity and facility.

You can also use the regex ``syslog_no_prio`` if there is no timestamp in syslog lines

* ``input://udp://0.0.0.0:514?type=syslog``
* ``filter://regex://syslog_no_prio?only_type=syslog``
