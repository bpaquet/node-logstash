Regex filter
---

Status : core plugin, unit tested and maintained.

The regex filter is used to extract data from lines of logs. The lines of logs are not modified by this filter.

Example 1: to extract the first word of a line of logs, and place it into the ``toto`` field.
Config using url: ``filter://regex://?regex=^(\S)+ &fields=toto``

Config using logstash format:
````
filter {
  regex {
    regex => /^(\S)/+/
    fields => [toto]
  }
}
````

Example 2: to extract fields following configuration into the http_combined pattern. node-logstash is bundled with [some configurations](https://github.com/bpaquet/node-logstash/tree/master/lib/patterns). You can add your custom patterns directories, see options ``--patterns_directories``.

Config using url: ``filter://regex://http_combined?only_type=nginx``

Config using logstash format:
````
filter {
  if [type] == 'nginx' {
    regex {
      builtin_regex => http_combined
    }
  }
}
````

Example 3: to force number extraction. If the macthed string is not a number but ``-``, the field ``a`` will not be set.

Config using url: ``filter://regex://?regex=(\d+|-)&fields=a&numerical_fields=a``

Config using logstash format:
````
filter {
  regex {
    regex => /(\d+|-)/
    fields => [a]
    numerical_fields => [a]
  }
}
````

Parameters:

* ``field``: the field to work on. Default to : message.
* ``regex``: regex to apply.
* ``regex_flags``: regex flags (eg : g, i, m).
* ``fields``: name of fields which will receive the pattern extracted (see below for the special field @timestamp).
* ``numerical_fields``: name of fields which have to contain a numerical value. If value is not numerical, field will not be set.
* ``date_format``: if ``date_format`` is specified and a ``@timestamp`` field is extracted, the filter will process the data extracted with the date\_format, using [moment](http://momentjs.com/docs/#/parsing/string-format/). The result will replace the original timestamp of the log line.

Note: fields with empty values will not be set.

See also [Grok filter](grok.md)