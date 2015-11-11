Cache Params
---

Status : core feature, unit tested and maintained.

Cache can be used to store results of costly requests (reverse dns, geoip request ...).
The cache is an [LRU cache](https://github.com/isaacs/node-lru-cache).

Params :
* ``cache_enabled``: enable or disable cache. Default value : true
* ``cache_size``: cache size (number of items). Default value : 10000
* ``cache_ttl``: ttl of cached items, in seconds. Default value : 10800 (3h).