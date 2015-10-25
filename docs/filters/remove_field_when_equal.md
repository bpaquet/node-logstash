Remove field when equal filter
---

Status : core plugin, unit tested and maintained.

The remove field when equal filter allow to remove a message when equal to a given value. Typical usage is to remove field containing ``-`` in apache or nginx logs.

Example : ``filter://remove_field_when_equal://http_user?value=-`` will remove the field ``http_user`` when equal to  ``-``.

Parameters:

* ``value``: value to check. Required params.
