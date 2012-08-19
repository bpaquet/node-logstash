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
  'date parsing': filter_helper.create('regex', '?regex=^(.*)$&fields=timestamp&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ', [
    {'@message': '31/Jul/2012:18:02:28 +0200}'},
    {'@message': '31/Jul/2012'},
    {'@message': 'toto'},
  ], [
    {'@message': '31/Jul/2012:18:02:28 +0200}', '@fields': {}, '@timestamp': '2012-07-31T18:02:28+02:00'},
    {'@message': '31/Jul/2012', '@fields': {}, '@timestamp': '2012-07-31T02:00:00+02:00'},
    {'@message': 'toto', '@fields': {}, '@timestamp': '0000-01-01T01:00:00+01:00'},
  ]),
  'nginx parsing': filter_helper.create('regex', '?regex=^(\\S+) - (\\S*) ?- \\[([^\\]]+)\\] "([^"]+)" (\\d+) (\\d+) "([^"]*)" "([^"]*)"&fields=ip,user,timestamp,request,status,bytes_sent,referer,user_agent&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ', [
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'},
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:48 +0200] "-" 400 0 "-" "-"'},
  ],[
    {
      '@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"',
      '@fields': {
        ip: '127.0.0.1',
        request: 'GET /favicon.ico HTTP/1.1',
        status: 502,
        bytes_sent: 574,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2',
        referer: '-',
      },
      '@timestamp': '2012-07-31T18:02:28+02:00'
    },
    {
      '@message': '127.0.0.1 - - [31/Jul/2012:18:02:48 +0200] "-" 400 0 "-" "-"',
       '@fields': {
        ip: '127.0.0.1',
        request: '-',
        status: 400,
        bytes_sent: 0,
        user_agent: '-',
        referer: '-',
      },
      '@timestamp': '2012-07-31T18:02:48+02:00'
    },
  ]),
}).export(module);