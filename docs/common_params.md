Common params for all output and filter plugins
---

Status : core feature, unit tested and maintained.

#### In url format

* ``only_type``: execute the filter / output plugin only on lines with specified type. Example: ``only_type=nginx``
* ``only_field_exist_toto``: execute the filter / output plugin only on lines with a field ``toto``. You can specify it multiple times, all fields have to exist.
* ``only_field_equal_toto=aaa``: execute the filter / output plugin only on lines with a field ``toto``, with value ``aaa``. You can specify it multiple times, all fields have to exist and have the specified value.
* ``only_field_match_toto=aaa$``: execute the filter / output plugin only on lines with a field ``toto``, with value match the regular expression ``aaa$``. You can specify it multiple times, all fields have to exist and match the regular expression.

#### In logstash config format

As in logstash, you can have an [event dependent configuration](https://www.elastic.co/guide/en/logstash/current/event-dependent-configuration.html).

Example 1: use statsd output only for a given type.
````
output {
  if [type] == nginx {
    statsd {
      host => localhost
      port => 8125
      metric_type => increment
      metric_key => nginx.request
    }
  }
}
````

As in logstash, you can use complex conditions: ``if [loglevel] == "ERROR" and [deployment] == "production" {``

You can use the following comparison operators:
* equality: ``==``, ``!=``, ``<``, ``>``, ``<=``, ``>=``
* regexp: ``=~``, ``!~``
* inclusion: ``in``, ``not in``

The supported boolean operators are: ``and``, ``or``, ``nand``, ``xor``.
The supported unary operators are: ``!``.


Conditions can be long and complex. You can use ``if``, ``elsif``, ``else``. Conditions can contain other expressions, you can negate expressions with !, and you can group them with parentheses (...).

