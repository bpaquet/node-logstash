Grep filter
---

Status : core plugin, unit tested and maintained.

The grep filter can remove lines which match or do not match a given regex.

Example 1: remove all lines which do not contain ``abc``. Equivalent to ``grep`
Config using url: ``filter://grep://?regex=abc``

Config using logstash format:
````
filter {
  grep {
    regex => 'abc'
  }
}
````

Example 2: remove all lines which contain ``abc``. Equivalent to ``grep -v``
Config using url: ``filter://grep://?regex=abc&invert=true``

Config using logstash format:
````
filter {
  grep {
    regex => /abc/
    invert => true
  }
}
````

Example 3: remove all lines with type ``nginx`` which do not contain ``abc`` and
Config using url: ``filter://grep://?type=nginx&regex=ab``

Config using logstash format:
````
filter {
  if [type] == 'nginx' {
    grep {
      regex => 'abc'
      invert => true
    }
  }
}
````

Parameters:

* ``regex``: regex to be matched. You have to escape special characters.
* ``regex_flags: regex flags (eg : g, i, m).
* ``invert``: if ``true``, remove lines which match. Default value: false.
