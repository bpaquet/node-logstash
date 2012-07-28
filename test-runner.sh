#!/bin/bash

set -e

cd test

for test in `ls test*.js`; do
  echo "Launching test : $test"
  NODE_PATH=../lib:../lib/lib vows $test --spec
  echo ""
done
