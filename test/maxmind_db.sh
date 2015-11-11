#!/bin/sh

export MAXMIND_DB_DIR="$(dirname $0)/maxmind/"
mkdir -p $MAXMIND_DB_DIR
$(dirname $0)/../node_modules/.bin/maxmind-geolite-mirror