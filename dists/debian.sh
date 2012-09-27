#!/bin/sh -e

SYNTAX="debian.sh logstash_sha1 package_version node_version"

SHA1=$1
VERSION=$2
NODE_VERSION=$3

DIRNAME=`pwd`

if [ "$SHA1" = "" ]; then
  echo $SYNTAX
  exit 1
fi

if [ "$VERSION" = "" ]; then
  echo $SYNTAX
  exit 1
fi

if [ "$NODE_VERSION" = "" ]; then
  echo $SYNTAX
  exit 1
fi

echo "Creating debian package for node-logstash, target package $VERSION, sha1 $SHA1, node version $NODE_VERSION"

PKG=node-logstash
NODE=node-v${NODE_VERSION}-linux-x64

rm -rf $PKG
cp -r debian $PKG
cd $PKG

sed -ie "s/##VERSION##/$VERSION/g" DEBIAN/control

cd opt/logstash
git clone git@github.com:bpaquet/node-logstash.git current
curl http://nodejs.org/dist/v${NODE_VERSION}/$NODE.tar.gz > $NODE.tar.gz
tar xvzf $NODE.tar.gz
mv $NODE node
export PATH=$DIRNAME/$PKG/opt/logstash/node/bin:$PATH
cd current
npm install --production
cd ..
cd ..
cd ..

cd ..

VERSION=`cat $PKG/DEBIAN/control | grep Version | awk '{print $2}'`
ARCH=`cat $PKG/DEBIAN/control | grep Architecture | awk '{print $2}'`

NAME="${PKG}_${VERSION}_${ARCH}.deb"

echo "Building $NAME"

dpkg --build $PKG $NAME