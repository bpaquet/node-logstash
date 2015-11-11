#!/bin/sh -e

TARGET=$1

if [ "$TARGET" = "" ]; then
  echo "Please specify target on command line"
  exit 1
fi

if [ "$NODE_VERSION" = "" ]; then
  NODE_VERSION=v0.12.7
fi

COMMAND="npm test"

if [ "$TEST" != "" ]; then
  COMMAND="TEST='$TEST' $COMMAND"
fi

if [ "$COVER" != "" ]; then
  COMMAND="COVER=$COVER $COMMAND"
fi

if [ "SSH_LD_LIBRARY_PATH" != "" ]; then
	COMMAND="LD_LIBRARY_PATH=$SSH_LD_LIBRARY_PATH $COMMAND"
fi

echo "Using node version $NODE_VERSION"
rsync -avh --delete --exclude=.git --exclude=test/maxmind --exclude=node_modules --exclude=coverage ../node-logstash/ $TARGET:node-logstash_$NODE_VERSION/
ssh $TARGET "source .nvm/nvm.sh && nvm use $NODE_VERSION && cd node-logstash_$NODE_VERSION && echo $NODE_VERSION > .node_version && $COMMAND"

if [ "$COVER" != "" ]; then
  rsync -avh --delete $TARGET:node-logstash_$NODE_VERSION/coverage/ coverage/
fi
