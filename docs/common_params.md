Common params for all output and filter plugins
---

* ``only_type``: execute the filter / output plugin only on lines with specified type. Example: ``only_type=nginx``
* ``only_field_exist_toto``: execute the filter / output plugin only on lines with a field ``toto``. You can specify it multiple times, all fields have to exist.
* ``only_field_equal_toto=aaa``: execute the filter / output plugin only on lines with a field ``toto``, with value ``aaa``. You can specify it multiple times, all fields have to exist and have the specified value.
* ``only_field_match_toto=aaa$``: execute the filter / output plugin only on lines with a field ``toto``, with value match the regular expression ``aaa$``. You can specify it multiple times, all fields have to exist and match the regular expression.
