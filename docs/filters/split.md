Split filter
---

Status : core plugin, unit tested and maintained.

The split filter is used to split a line of log into multiple lines, on a given delimiter.

Example 1: ``filter://split://?delimiter=|`` split all lines of logs on ``|`` char.

Config using url: ``filter://split://?delimiter=|``.
You have to url encode special chars (%0A for ``\n``).

Config using logstash format:
````
filter {
  split {
    delimiter => '|'
  }
}
````

Parameters:

* ``delimiter``: delimiter used to split.
