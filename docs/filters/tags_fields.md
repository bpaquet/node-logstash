Tags and fields for filters plugins
---

Status : core feature, unit tested and maintained.

Some filters plugins supports ``add_tags``, ``add_field``, ``add_fields``, ``remove_tags``, ``remove_fields`` params.

* ``add_tags``: arbitrary tags to add to each data if filter is successful. Must be an array. In url config format, use ``,`` for splitting. Eg : ``add_tags=a,b``.
* ``add_fields`` and ``add_fields``: arbiraty tags to add to each data if filter is sucessful. Must be an hash. In url config format, use ``:`` and ``,``. Eg : ``add_fields=key1:value1,key2:value2`. Note : interpolated strings can be used in values.
* ``remove_tags``: arbitrary tags to add to each data if filter is successful. Must be an array. In url config format, use ``,`` for splitting. Eg : ``tags=a,b``.
* ``remove_field`` and ``removed_fields``: arbiraty remove fields to each data if filter is sucessful. Must be an array. In url config format, use ``,``. Eg : ``remove_fields=key1,key2`

Example using logstash format:

````
filter {
  grok {
    match => '%{IP}'
    add_tags => toto
    add_fields => {
      a => b
      c => d
    }
  }
}
````

or

````
filter {
  grok {
    match => '%{IP}'
    add_tags => [a , b]
    add_field => { a => b }
  }
}
````
