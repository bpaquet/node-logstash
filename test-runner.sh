#!/bin/bash

set -e

if [ "$TEST" = "" ]; then
  TEST=`ls test/test*.js`
  RUN_JSHINT=1
fi

export PATH="/usr/sbin:$PATH"
export TZ="Etc/GMT"
export NODE_PATH="test:lib:$NODE_PATH"

echo "Launching test : $TEST"

if [ "$COVER" != "" ]; then
  rm -rf coverage
  istanbul cover node_modules/.bin/vows -- $TEST --spec
else
  node_modules/.bin/vows $TEST --spec
fi

echo ""

if [ "$RUN_JSHINT" = "1" ]; then
  ./jshint.sh
fi
