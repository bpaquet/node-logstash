var vows = require('vows'),
    assert = require('assert'),
    moment = require('moment'),
    patterns_loader = require('../lib/lib/patterns_loader'),
    filter_helper = require('./filter_helper');

var n = moment();

patterns_loader.add('/toto');
patterns_loader.add('/tata');
patterns_loader.add('../lib/patterns');

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
  'number management': filter_helper.create('regex', '?regex=^(\\S+)$&fields=a', [
    {'@message': '12'},
    {'@message': '90'},
    {'@message': '12.3'},
    {'@message': '11,67'},
    {'@message': 'aa'},
    {'@message': ''},
  ], [
    {'@message': '12', '@fields': {a: 12}},
    {'@message': '90', '@fields': {a: 90}},
    {'@message': '12.3', '@fields': {a: 12.3}},
    {'@message': '11,67', '@fields': {a: 11.67}},
    {'@message': 'aa', '@fields': {a: 'aa'}},
    {'@message': ''},
  ], function(r) {
    assert.equal(typeof(r[0]['@fields'].a), 'number');
    assert.equal(typeof(r[1]['@fields'].a), 'number');
    assert.equal(typeof(r[2]['@fields'].a), 'number');
    assert.equal(typeof(r[3]['@fields'].a), 'number');
    assert.equal(typeof(r[4]['@fields'].a), 'string');
  }),
  'with star': filter_helper.create('regex', '?regex=^(\\S*) (\\S+)&fields=fa,fb', [
    {'@message': ' efgh ijk'},
  ], [
    {'@message': ' efgh ijk', '@fields': {fb: 'efgh'}},
  ]),
  'type filtering': filter_helper.create('regex', '?only_type=toto&regex=^(\\S+) (\\S+)&fields=fa,fb', [
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
  'numerical_fields': filter_helper.create('regex', '?regex=^(\\S+) (\\d+|-)&fields=fa,fb&numerical_fields=fb', [
    {'@message': 'abcd 123 ijk'},
    {'@message': 'abcd - ijk'},
  ], [
    {'@message': 'abcd 123 ijk', '@fields': {fa: 'abcd', fb: 123}},
    {'@message': 'abcd - ijk', '@fields': {fa: 'abcd'}},
  ]),
  'date parsing': filter_helper.create('regex', '?regex=^(.*)$&fields=timestamp&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ', [
    {'@message': '31/Jul/2012:18:02:28 +0200'},
    {'@message': '31/Jul/2012'},
    {'@message': 'toto'},
  ], [
    {'@message': '31/Jul/2012:18:02:28 +0200', '@fields': {}, '@timestamp': '2012-07-31T16:02:28.000+0000'},
    {'@message': '31/Jul/2012', '@fields': {}, '@timestamp': '2012-07-31T00:00:00.000+0000'},
    {'@message': 'toto', '@fields': {}},
  ]),
  'missing fields in date': filter_helper.create('regex', '?regex=^(.*)$&fields=timestamp&date_format=HH:mm:ss ZZ', [
    {'@message': '18:02:28'},
  ], [
    {'@message': '18:02:28', '@fields': {}, '@timestamp': n.year() + '-01-01T18:02:28.000+0000'},
  ]),
  'change message': filter_helper.create('regex', '?regex=^abcd(.*)efgh$&fields=@message', [
    {'@message': 'abcd12345efgh'},
  ], [
    {'@message': '12345', '@fields': {}},
  ]),
  'change source host': filter_helper.create('regex', '?regex=^(abcd)(.*)efgh$&fields=a,@source_host', [
    {'@message': 'abcd12345efgh'},
  ], [
    {'@message': 'abcd12345efgh', '@fields': {'a': 'abcd'}, '@source_host': '12345'},
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
      '@timestamp': '2012-07-31T16:02:28.000+0000'
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
      '@timestamp': '2012-07-31T16:02:48.000+0000'
    },
  ], function(r) {
    assert.equal(typeof(r[0]['@fields'].status), 'number');
    assert.equal(typeof(r[0]['@fields'].bytes_sent), 'number');
    assert.equal(typeof(r[0]['@fields'].referer), 'string');
  }),
  'http combined with predefined type': filter_helper.create('regex', 'http_combined', [
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'},
    {'@message': '88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"'}
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
        user: '-',
      },
      '@timestamp': '2012-07-31T16:02:28.000+0000'
    },
    {
      '@message': '88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"',
      '@fields': {
        user: 'cdv',
        bytes_sent: 172,
        ip: '88.178.233.127',
        status: 304,
        referer: '-',
        user_agent: 'Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07',
        request: 'GET /public/utils/ejam.jar HTTP/1.1'
      },
      '@timestamp': '2012-10-12T14:23:28.000+0000'
    }
  ]),
  'http vhost combined with predefined type': filter_helper.create('regex', 'http_vhost_combined', [
    {'@message': 'ip-10-62-95-254.eu-west-1.compute.internal:80 88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"'},
    {'@message': 'www.skillstar.com:80 86.221.21.138 - - [13/Oct/2012:09:04:42 +0200] "GET /favicon.ico HTTP/1.1" 304 0 "-" "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1"'},
  ],[
    {
      '@message': 'ip-10-62-95-254.eu-west-1.compute.internal:80 88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"',
      '@fields': {
        user: 'cdv',
        bytes_sent: 172,
        ip: '88.178.233.127',
        status: 304,
        referer: '-',
        user_agent: 'Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07',
        request: 'GET /public/utils/ejam.jar HTTP/1.1',
        vhost: 'ip-10-62-95-254.eu-west-1.compute.internal:80',
      },
      '@timestamp': '2012-10-12T14:23:28.000+0000'
    },
    {
      '@message': 'www.skillstar.com:80 86.221.21.138 - - [13/Oct/2012:09:04:42 +0200] "GET /favicon.ico HTTP/1.1" 304 0 "-" "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1"',
      '@fields': {
        user: '-',
        bytes_sent: 0,
        ip: '86.221.21.138',
        status: 304,
        referer: '-',
        vhost: 'www.skillstar.com:80',
        user_agent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
        request: 'GET /favicon.ico HTTP/1.1'
      },
      '@timestamp': '2012-10-13T07:04:42.000+0000'
    }
  ]),
}).export(module);