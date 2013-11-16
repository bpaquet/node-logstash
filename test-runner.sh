#!/bin/bash

set -e

if [ "$TEST" = "" ]; then
  TEST=`ls test/test*.js`
fi

export PATH="/usr/sbin:$PATH"
export TZ="Etc/GMT"
export NODE_PATH="test:lib:$NODE_PATH"

echo "Launching test : $TEST"

if [ "$COVER" != "" ]; then
  rm -rf coverage
  istanbul cover node_modules/.bin/vows -- $TEST --spec
else
  vows $TEST --spec
fi

echo ""
