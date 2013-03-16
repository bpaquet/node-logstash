#!/bin/sh -e

TARGET=$1

if [ "$TARGET" = "" ]; then
  echo "Please specify target on command line"
  exit 1
fi

if [ "$NODE_VERSION" = "" ]; then
  NODE_VERSION=0.8.16
fi

COMMAND="npm test"

if [ "$TEST" != "" ]; then
  COMMAND="TEST='$TEST' npm test"
fi

echo "Using node version $NODE_VERSION"
rsync -avh --delete --exclude=.git --exclude=node_modules ../node-logstash/ $TARGET:node-logstash_$NODE_VERSION/
ssh $TARGET "source .nvm/nvm.sh && nvm use v$NODE_VERSION && cd node-logstash_$NODE_VERSION && $COMMAND"