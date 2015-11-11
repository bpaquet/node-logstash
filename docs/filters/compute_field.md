Compute field filter
---

Status : core plugin, unit tested and maintained.

The compute field filter is used to add a new field to a line, with a fixed value, or with a value computed from other fields.

Example 1: add a field named ``toto`` with value ``abc``
Config using url: ``filter://compute_field://toto?value=abc``

Config using logstash format:
````
filter {
  compute_field {
    field => toto
    value => abc
  }
}
````

Example 2: add a field named ``toto`` with value ``abcef``, if line contain a field ``titi`` with value ``ef``
Config using url: ``filter://compute_field://toto?value=abc#{titi}``

Config using logstash format:
````
filter {
  compute_field {
    field => toto
    value => "abc#{titi}"
  }
}
```

Parameters:

* ``field``: which field to work on.
* ``value``: value to be placed in the given field.
