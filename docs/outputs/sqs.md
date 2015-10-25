SQS output plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to send logs to [SQS](https://aws.amazon.com/en/sqs/).

Example :
* ``output://sqs://sqs.eu-west-1.amazonaws.com/66171255634/test?aws_access_key_id=key&aws_secret_access_key=secret``: send messages to the SQS queue ``sqs.eu-west-1.amazonaws.com/66171255634/test``

Parameters :
* ``aws_access_key_id``: your AWS Access Key Id. Required.
* ``aws_secret_access_key``: your AWS Secret Access Key Id. Required.
* ``serializer``: more doc at [serializers](serializers.md). Default value to ``json_logstash``.
* ``format``: params used by the ``raw`` [serializer](serializers.md).
