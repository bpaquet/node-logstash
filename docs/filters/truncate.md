Truncate filter
---

Status : core plugin, unit tested and maintained.

The truncate filter is used to truncate the log message at a certain size.

Example 1: truncate the message field to a max size of 200.

Config using url: ``filter://truncate://?max_size=200``

Config using logstash format:
````
filter {
  truncate {
    max_size => 200
  }
}
````

Parameters:

* ``max_size``: Maximum size of a message.
