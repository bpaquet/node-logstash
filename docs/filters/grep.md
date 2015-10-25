Grep filter
---

Status : core plugin, unit tested and maintained.

The grep filter can remove lines which match or do not match a given regex.

Example 1: ``filter://grep://?regex=abc`` remove all lines which do not contain ``abc``. Equivalent to ``grep`

Example 2: ``filter://grep://?regex=abc&invert=true`` remove all lines which contain ``abc``. Equivalent to ``grep -v``

Example 3: ``filter://grep://?type=nginx&regex=abc`` remove all lines with type ``nginx`` which do not contain ``abc`` and

Parameters:

* ``regex``: regex to be matched. You have to escape special characters.
* ``regex_flags: regex flags (eg : g, i, m).
* ``invert``: if ``true``, remove lines which match. Default value: false.
