Bunyan filter
---

Status : core plugin, unit tested and maintained.

The bunyan filter parse the [bunyan log format](https://github.com/trentm/node-bunyan).

Example 1 :  parse the logs with type toto, using the bunyan log format.
Config using url: ``filter://bunyan://?only_type=toto``

Config using logstash format:
````
filter {
  if [type] == 'toto' {
    bunyan {}
  }
}
````
