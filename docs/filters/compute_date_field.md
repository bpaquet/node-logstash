Compute date field filter
---

Status : core plugin, unit tested and maintained.

The compute date field filter is used to compute a date field from ``timestamp``field, using using [moment](http://momentjs.com/docs/#/parsing/string-format/) date format.

Example 1: ``filter://compute_date_field://toto?date_format=DD/MMMM/YYYY`` add a field named ``toto``, containing timestamp formated with ``DD/MMMM/YYYY``

Parameters:

* ``date_format``: date format string, using [moment](http://momentjs.com/docs/#/parsing/string-format/)
