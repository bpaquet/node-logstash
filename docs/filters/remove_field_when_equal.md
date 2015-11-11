Remove field when equal filter
---

Status : core plugin, unit tested and maintained.

The remove field when equal filter allow to remove a message when equal to a given value. Typical usage is to remove field containing ``-`` in apache or nginx logs.

Example 1: will remove the field ``http_user`` when equal to  ``-``.
Config using url: ``filter://remove_field_when_equal://http_user?value=-``

Config using logstash format:
````
filter {
  remove_field_when_equal {
    field => http_user
    value => '-'
  }
}
````

Parameters:

* ``field``: which field to work on.
* ``value``: value to check. Required params.
