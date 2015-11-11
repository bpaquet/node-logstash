Json fields filter
---

Status : core plugin, unit tested and maintained.

The json fields filter is used to parse the message payload as a JSON object, and merge it into current object.

This allows to automatically index fields for messages that already contain a well-formatted JSON payload. The JSON object is parsed starting from the first ``{`` character found in the message.

Filter does nothing in case of error while parsing the message. Existing attributes in current line are kept, but overwritten if they conflict with attributes from the parsed payload.

Example 1: will parse, as JSON, the given stream of messages which ``type`` matches ``json_stream``.
Config using url: ``filter://json_fields://?only_type=json_stream``

Config using logstash format:
````
filter {
  if [type] == 'json_stream' {
    json_fields
  }
}
```
