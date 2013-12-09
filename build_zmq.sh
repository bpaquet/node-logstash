#!/bin/sh

set -e

target=$1
version=$2

if [ "$target" = "" -o "$version" = "" ]; then
	echo "Usage $0 target version"
	exit 1
fi

echo "Installing ZeroMQ version $version to $target"
cd /tmp
rm -rf zeromq-$version.tar.gz $target
wget http://download.zeromq.org/zeromq-$version.tar.gz
tar xzf zeromq-$version.tar.gz
mv zeromq-$version $target

echo "Compiling"
cd $target
./configure
make

echo "ZeromMQ version $version ready in $target"
echo "Env var to set"
echo "export CPLUS_INCLUDE_PATH=$target/include"
echo "export LB_LIBRARY_PATH=$target/src/.libs"
echo "export LIBRARY_PATH=$target/src/.libs"