Grok filter
---

Status : core plugin, unit tested and maintained.

The grok filter is used to extract data using [grok patterns](http://logstash.net/docs/latest/filters/grok). The lines of logs are not modified by this filter.

Grok is a simple pattern defining language. The syntax for a grok pattern is ``%{SYNTAX:SEMANTIC}``.

The ``SYNTAX`` is the name of the pattern that will match the text.

The ``SEMANTIC`` is the field name to assign the value of the matched text.

Grok rides on the Origuruma regular expressions library, so any valid regular expression in that syntax is valid for grok.
You can find the fully supported syntax on the [Origuruma site](http://www.geocities.jp/kosako3/oniguruma/doc/RE.txt).

The grok filter has many built-in grok patterns. The full list can be found in the [patterns folder](lib/patterns/grok).
(Note: patterns were copied from [elasticsearch/patterns](https://github.com/elasticsearch/logstash/tree/master/patterns)).

Example 1: if ``message``field is ``hello 123``, the filter will add the field ``w1`` with value ``hello`` and field ``num1`` with value ``123``.
Config using url: ``filter://grok://?match=%{WORD:w1} %{NUMBER:num1}``

Config using logstash format:
````
filter {
  grok {
    match => '%{WORD:w1} %{NUMBER:num1}'
  }
}
````

Example 2: to extract fields from a haproxy log. The ``HAPROXYHTTP`` pattern is already built-in to the grok filter.
Config using url: ``filter://grok://only_type=haproxy&match=%{HAPROXYHTTP}``

Config using logstash format:
````
filter {
  if [type] == haproxy {
    grok {
      match => %{HAPROXYHTTP}
    }
  }
}
````

Example 3: to load custom patterns from the ``/path/to/file`` file that defines the ``MY_PATTERN`` pattern.
Config using url: ``filter://grok://?extra_patterns_file=/path/to/file&match=%{MY_PATTERN}``

Config using logstash format:
````
filter {
  grok {
    extra_patterns_file => '/path/to/file'
    match => '%{MY_PATTERN}'
  }
}
````

Parameters:

* ``match``: the grok pattern to apply.
* ``extra_patterns_file``: path to a file containing custom patterns to load.
* ``numerical_fields``: name of fields which have to contain a numerical value. If value is not numerical, field will not be set.
* ``date_format``: if ``date_format`` is specified and a ``@timestamp`` field is extracted, the filter will process the data extracted with the date\_format, using [moment](http://momentjs.com/docs/#/parsing/string-format/). The result will replace the original timestamp of the log line.
* ``tag_on_failure``: if the parse fail, tags in this paramter will be added. In url config format, use ``,`` for splitting. Eg : ``tag_on_failure=a,b``. Default: ``["_grokparsefailure"]``.
* ``add_tags``, ``add_field``, ``add_fields``, ``remove_tags``, ``remove_fields``: tags and fields to add or remove when parsing is ok. More doc at [tags and fields](./tags_fields.md).

Note: fields with empty values will not be set.
