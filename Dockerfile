FROM node:0.10-onbuild
MAINTAINER Stephan Buys <stephan.buys@panoptix.co.za>

ENV REFRESHED_ON "16 Jul 2015"

ENTRYPOINT bin/node-logstash-agent
