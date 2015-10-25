Reverse DNS filter
---

Status : core plugin, unit tested and maintained.

The reverse dns filter replace an ip in a field by the hostname, performing a dns resolution. This is useful with syslog.

Example 1: ``filter://reverse_dns://host`` performs a dns resolution on the field ``host``.

Parameters:

* ``target_field``: field to store the result. Default: field used for resolution.
* ``only_hostname``: after dns resolution, the filter will keep only the first word of dns name. Example : 'www.free.fr' will be transformed to 'www'. Default value: true
