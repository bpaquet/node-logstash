#!/bin/bash

set -e

cd test

if [ "$TEST" = "" ]; then
  TEST=`ls test*.js`
fi

for test in $TEST; do
  echo "Launching test : $test"
  PATH=/usr/sbin:$PATH TZ=Etc/GMT NODE_PATH=../lib:../lib/lib vows $test --spec
  echo ""
done
