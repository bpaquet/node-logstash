SSL Params
---

Status : core feature, unit tested and maintained.

When you are in SSL mode (client or server), you can use [all the parameters using by node for SSL / TLS](http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener), prefixed by ``ssl_``.
You have to give path for certificate and key params, node-logstash will load them before initializing SSL / TLS stack.

For example, for a HTTPS server : ``ssl=true&ssl_cert=/path/to/cert&ssl_key=/path/to/key``

For using a Certificate authority, add ``&ssl_ca=/path/to/ca``.

For changing SSL ciphers, add ``ssl_ciphers=AES128-GCM-SHA256``.

To use a client certificate, add ``ssl_cert=/client.cer&ssl_key=/client.key&ssl_ca=/tmp/ca.key``.

To ignore ssl errors, add ``ssl_rejectUnauthorized=false`.
