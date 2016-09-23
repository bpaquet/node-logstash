#!/bin/bash

[ -f /etc/default/logstash ] && . /etc/default/logstash

NODE_OPTS="$NODE_OPTS  --log_file /opt/logstash/shared/log/logstash.log"

export NODE_ENV=production
export PATH=/opt/logstash/node/bin:$PATH
cd /opt/logstash/current
exec node $* $NODE_OPTS
