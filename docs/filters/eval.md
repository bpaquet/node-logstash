Eval filter
---

Status : core plugin, unit tested and maintained.

The eval filter is used to process a field with javascript code.

Example 1: ``filter://eval://delay?operation=x*1000`` multiply the value of field ``delay`` by 1000.
Example 2: ``filter://eval://toto?operation=x+%22a%22`` add ``a`` character to the field ``toto``.

Parameters:

* ``operation``: javascript code to execute. The input field is in the ``x`` variable.
* ``target_field``: field to store the result. Default : source field.
