Force fields mapping in ElasticSearch
---

If you have a custom field with an hashcode
- if the first hashcode of the day contains only digits, ElasticSearch will guess the field type and will choose integer. After that, it will fail to index the next values that contains letters.
- by default ElasticSearch will tokenize it like some real text instead of treating it like a blob, it won't impact tools like kibana but may prevent you from doing custom queries.

For both cases you should add a `default-mapping.json` file in ElasticSearch config directory :

```json
{
  "_default_": {
    "properties": {
      "my_hash_field": {
        "type" : "string",
        "index" : "not_analyzed"
      }
    }
  }
}
