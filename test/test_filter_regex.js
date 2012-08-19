var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    filter_helper = require('./filter_helper');

vows.describe('Filter regex ').addBatch({
  'normal': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa,fb', [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@fields': {fc: 'toto'}},
    {'@message': 'abcdefghijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd', fb: 'efgh'}},
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd', fb: 'efgh', fc: 'toto'}},
    {'@message': 'abcdefghijk'},
  ]),
  'with star': filter_helper.create('regex', '?regex=^(\\S*) (\\S+)&fields=fa,fb', [
    {'@message': ' efgh ijk'},
  ], [
    {'@message': ' efgh ijk', '@fields': {fb: 'efgh'}},
  ]),
  'type filtering': filter_helper.create('regex', '?type=toto&regex=^(\\S+) (\\S+)&fields=fa,fb', [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@type': 'toto'},
    {'@message': 'abcd efgh ijk', '@type': 'toto2'},
  ], [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@type': 'toto', '@fields': {fa: 'abcd', fb: 'efgh'}},
    {'@message': 'abcd efgh ijk', '@type': 'toto2'},
  ]),
  'two fields one in regex': filter_helper.create('regex', '?regex=^(\\S+) \\S+&fields=fa,fb', [
     {'@message': 'abcd efgh ijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd'}},
  ]),
  'one field two in regex': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa', [
    {'@message': 'abcd efgh ijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd'}},
  ]),
  'nginx parsing': filter_helper.create('regex', '?regex=^(\\S+) - (\\S*) ?- \\[([^\\]]+)\\] "(\\S+) (\\S+) \\S+" (\\d+) (\\d+) "([^"]*)" "([^"]*)"&fields=ip,user,timestamp,method,url,status,bytes_sent,referer,user_agent', [
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'},
  ],[
    {
      '@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"',
      '@fields': {
        ip: '127.0.0.1',
        timestamp: '31/Jul/2012:18:02:28 +0200',
        method: 'GET',
        status: 502,
        bytes_sent: 574,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2',
        referer: '-',
        url: '/favicon.ico'
      }
    }
  ]),
}).export(module);