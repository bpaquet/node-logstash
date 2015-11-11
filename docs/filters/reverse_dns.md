Reverse DNS filter
---

Status : core plugin, unit tested and maintained.

The reverse dns filter replace an ip in a field by the hostname, performing a dns resolution. This is useful with syslog.

Example 1: performs a dns resolution on the field ``host``.

Config using url: ``filter://reverse_dns://host``

Config using logstash format:
````
filter {
  reverse_dns {
    field => dns
    cache_size => 1000
  }
}
````

Parameters:

* ``field``: which field to work on.
* ``target_field``: field to store the result. Default: field used for resolution.
* ``only_hostname``: after dns resolution, the filter will keep only the first word of dns name. Example : 'www.free.fr' will be transformed to 'www'. Default value: true.
* ``cache_*``: cache configuration. More doc at [cache](../cache.md).