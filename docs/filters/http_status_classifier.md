HTTP Status classifier filter
---

Status : core plugin, unit tested and maintained.

The http status classifier filter parse the status code.

Example 1: parse the ``http_status`` field and fill the ``http_class`` field with value like ``2xx``, ``3xx``.
Config using url: ``filter://http_status_classifier://http_status``

Config using logstash format:
````
filter {
  http_status_classifier {
    field => http_status
  }
}
```

Parameters:
* ``field``: which field to work on.
* ``target_field``: field to store the result. Default : ``http_class``.
* ``special_codes``: http status codes to be kept as is. Eg, with ``498,499`` value in ``special_codes``, the filter will put 499 in the ``http_class`` field when receiving a ``499`` http code, and not ``4xx``. Mutlipe values must be separated with ``,``. Default value: empty.
