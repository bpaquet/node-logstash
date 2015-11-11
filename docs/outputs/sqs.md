SQS output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to send logs to [SQS](https://aws.amazon.com/en/sqs/).

Example : send messages to the SQS queue ``sqs.eu-west-1.amazonaws.com/66171255634/test``
Config using url: ``output://sqs://sqs.eu-west-1.amazonaws.com/66171255634/test?aws_access_key_id=key&aws_secret_access_key=secret`

Config using logstash format:
````
output {
  sqs {
    aws_queue => "sqs.eu-west-1.amazonaws.com/66171255634/test"
    aws_access_key_id => key
    aws_secret_access_key => secret
  }
}
````

Parameters :
* ``aws_queue``: the aws queue url.
* ``aws_access_key_id``: your AWS Access Key Id. Required.
* ``aws_secret_access_key``: your AWS Secret Access Key Id. Required.
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
