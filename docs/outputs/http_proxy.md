Use HTTP proxy in HTTP output plugins
---

Status : core feature, unit tested and maintained.

The proxy parameter allow to use an http proxy.

The proxy url must have the format ``http[s]://[userinfo@]hostname[:port]`` which gives support for:
  * http and https proxies
  * proxy authentication via userinfo ``username:password`` in plain text.
  * proxy port

WARN : The HTTP agent API has changed between Node 0.10 and 0.12. This feature is not compatible with Node < 0.12