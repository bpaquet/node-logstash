Rename filter
---

Status : core plugin, unit tested and maintained.

The truncate filter is used to rename a field

Example 1: rename the ``ts`` field to ``timestamp``.

Config using url: ``filter://rename://ts?to=timestamp``

Config using logstash format:
````
filter {
  rename {
    from => ts
    to => timestamp
  }
}
````

Parameters:

* ``from``: Source field name.
* ``to``: Target field name.
