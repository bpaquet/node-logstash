Compute field filter
---

Status : core plugin, unit tested and maintained.

The compute field filter is used to add a new field to a line, with a fixed value, or with a value computed from other fields.

Example 1: ``filter://compute_field://toto?value=abc`` add a field named ``toto`` with value ``abc``

Example 2: ``filter://compute_field://toto?value=abc#{titi}`` add a field named ``toto`` with value ``abcef``, if line contain a field ``titi`` with value ``ef``

Parameters:

* ``value``: value to be placed in the given field.
