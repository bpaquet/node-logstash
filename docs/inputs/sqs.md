SQS input plugin
---

Status : core plugin, fully tested.

This plugin is used to get logs from [SQS](https://aws.amazon.com/en/sqs/). This plugin use [long polling](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ReceiveMessage.html) to get messages faster.

Example :
* ``input://sqs://sqs.eu-west-1.amazonaws.com/66171255634/test?aws_access_key_id=key&aws_secret_access_key=secret``: get messages from the SQS queue ``sqs.eu-west-1.amazonaws.com/66171255634/test``

Parameters :
* ``aws_access_key_id``: your AWS Access Key Id. Required.
* ``aws_secret_access_key``: your AWS Secret Access Key Id. Required.
* ``polling_delay``: the long polling max delay, in seconds. Default value : 10.
* ``unserializer``: more doc at [unserializers](unserializers.md). Default value to ``json_logstash``.
