Mutate replace filter
---

Status : core plugin, unit tested and maintained.

The mutate replace filter is used to run regex on specified field.

Example: ``filter://mutate_replace://toto?from=\\.&to=-`` replace all ``.`` in ``toto`` field by ``-``

Parameters:

* ``from``: regex to find pattern which will be replaced. You have to escape special characters.
* ``to``: replacement string.
