#!/bin/sh -e

TARGET=$1

if [ "$TARGET" = "" ]; then
  echo "Please specify target on command line"
  exit 1
fi

COMMAND="npm test"

if [ "$TEST" != "" ]; then
  COMMAND="TEST='$TEST' npm test"
fi

rsync -avh --delete --exclude=.git --exclude=node_modules ../node-logstash/ $TARGET:node-logstash/
ssh $TARGET "source .nvm/nvm.sh && nvm use default && cd node-logstash && $COMMAND"