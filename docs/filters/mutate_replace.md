Mutate replace filter
---

Status : core plugin, unit tested and maintained.

The mutate replace filter is used to run regex on specified field.

Example 1: replace all ``.`` in ``toto`` field by ``-``

Config using url: ``filter://mutate_replace://toto?from=\\.&to=-``

Config using logstash format:
````
filter {
  mutate_replace {
    field => toto
    from => /\./
    to => -
  }
}
````

Parameters:

* ``field``: which field to work on.
* ``from``: regex to find pattern which will be replaced. You have to escape special characters.
* ``to``: replacement string.
