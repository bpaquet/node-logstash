Multiline filter
---

Status : core plugin, unit tested and maintained.

The multiline filter is used to regroup lines into blocks. For example, you can group lines from a Java stacktrace into single line of log. To do that, you have to provide a regular expression which match the first line of each block. Standard way is to detect a timestamp.

Example 1: to regroup lines by blocks, each block have to start with a line with a date like ``2012-12-02``
Config using url: ``filter://multiline://?start_line_regex=^\\d{4}-\\d{2}-\\d{2}``

Config using logstash format:
````
filter {
  multiline {
    start_line_regex => /^\d{4}-\d{2}-\d{2}/
  }
}
````

Parameters:

* ``start_line_regex``: regular expression which is used to find lines which start blocks. You have to escape special characters.
* ``regex_flags: regex flags (eg : g, i, m).
* ``max_delay``: delay to wait the end of a block. Default value: 50 ms. Softwares which write logs by block usually write blocks in one time, this parameter is used to send lines without waiting the next matching start line.
