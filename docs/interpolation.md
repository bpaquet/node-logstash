Interpolation
---

When a plugin param is a string, you can use string interpolation to reference line data:

* ``#{message}`` will return the full log line
* ``#{type}`` will return the type of log line
* ``#{toto}`` will return the value of the field ``toto``, which have to be extracted with a regex filter
* ``2#{toto}`` will return ``2`` followed by the value of the field ``toto``.
* ``#{now:YYYY}`` will return the current year. YYYY is a date format passed to [moment](http://momentjs.com/docs/#/parsing/string-format/) to format current date.
