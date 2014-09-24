var vows = require('vows'),
  assert = require('assert'),
  moment = require('moment'),
  patterns_loader = require('lib/patterns_loader'),
  filter_helper = require('./filter_helper');

var n = moment();

patterns_loader.add('/toto42');
patterns_loader.add('/tata43');
patterns_loader.add('lib/patterns');

vows.describe('Filter regex ').addBatch({
  'normal': filter_helper.create('regex', '?regex=^(a\\S+) (\\S+)&fields=fa,fb', [
    {
      'message': 'abcd efgh ijk'
    },
    {
      'message': 'abcd efgh ijk',
      fc: 'toto'
    },
    {
      'message': 'Abcd efghijk'
    },
  ], [
    {
      'message': 'abcd efgh ijk',
      fa: 'abcd',
      fb: 'efgh'
    },
    {
      'message': 'abcd efgh ijk',
      fa: 'abcd',
      fb: 'efgh',
      fc: 'toto'
    },
    {
      'message': 'Abcd efghijk'
    },
  ]),
  'regex flags': filter_helper.create('regex', '?regex=^(a\\S+) (\\S+)&fields=fa,fb&regex_flags=i', [
    {
      'message': 'abcd efgh ijk'
    },
    {
      'message': 'abcd efgh ijk',
      fc: 'toto'
    },
    {
      'message': 'Abcd efghijk'
    },
  ], [
    {
      'message': 'abcd efgh ijk',
      fa: 'abcd',
      fb: 'efgh'
    },
    {
      'message': 'abcd efgh ijk',
      fa: 'abcd',
      fb: 'efgh',
      fc: 'toto'
    },
    {
      'message': 'Abcd efghijk',
      fa: 'Abcd',
      fb: 'efghijk',
    },
  ]),
  'number management': filter_helper.create('regex', '?regex=^(\\S+)$&fields=a', [
    {
      'message': '12'
    },
    {
      'message': '90'
    },
    {
      'message': '12.3'
    },
    {
      'message': '11,67'
    },
    {
      'message': 'aa'
    },
    {
      'message': ''
    },
  ], [
    {
      'message': '12',
      a: 12
    },
    {
      'message': '90',
      a: 90
    },
    {
      'message': '12.3',
      a: 12.3
    },
    {
      'message': '11,67',
      a: 11.67
    },
    {
      'message': 'aa',
      a: 'aa'
    },
    {
      'message': ''
    },
  ], function(r) {
    assert.equal(typeof(r[0].a), 'number');
    assert.equal(typeof(r[1].a), 'number');
    assert.equal(typeof(r[2].a), 'number');
    assert.equal(typeof(r[3].a), 'number');
    assert.equal(typeof(r[4].a), 'string');
  }),
  'with star': filter_helper.create('regex', '?regex=^(\\S*) (\\S+)&fields=fa,fb', [
    {
      'message': ' efgh ijk'
    },
  ], [
    {
      'message': ' efgh ijk',
      fb: 'efgh'
    },
  ]),
  'type filtering': filter_helper.create('regex', '?only_type=toto&regex=^(\\S+) (\\S+)&fields=fa,fb', [
    {
      'message': 'abcd efgh ijk'
    },
    {
      'message': 'abcd efgh ijk',
      'type': 'toto'
    },
    {
      'message': 'abcd efgh ijk',
      'type': 'toto2'
    },
  ], [
    {
      'message': 'abcd efgh ijk'
    },
    {
      'message': 'abcd efgh ijk',
      'type': 'toto',
      fa: 'abcd',
      fb: 'efgh'
    },
    {
      'message': 'abcd efgh ijk',
      'type': 'toto2'
    },
  ]),
  'two fields one in regex': filter_helper.create('regex', '?regex=^(\\S+) \\S+&fields=fa,fb', [
    {
      'message': 'abcd efgh ijk'
    },
  ], [
    {
      'message': 'abcd efgh ijk',
      fa: 'abcd'
    },
  ]),
  'one field two in regex': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa', [
    {
      'message': 'abcd efgh ijk'
    },
  ], [
    {
      'message': 'abcd efgh ijk',
      fa: 'abcd'
    },
  ]),
  'numerical_fields': filter_helper.create('regex', '?regex=^(\\S+) (\\d+|-)&fields=fa,fb&numerical_fields=fb', [
    {
      'message': 'abcd 123 ijk'
    },
    {
      'message': 'abcd - ijk'
    },
  ], [
    {
      'message': 'abcd 123 ijk',
      fa: 'abcd',
      fb: 123
    },
    {
      'message': 'abcd - ijk',
      fa: 'abcd'
    },
  ]),
  'date parsing': filter_helper.create('regex', '?regex=^(.*)$&fields=timestamp&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ', [
    {
      'message': '31/Jul/2012:18:02:28 +0200'
    },
    {
      'message': '31/Jul/2012'
    },
    {
      'message': 'toto'
    },
  ], [
    {
      'message': '31/Jul/2012:18:02:28 +0200',
      '@timestamp': '2012-07-31T16:02:28.000+0000'
    },
    {
      'message': '31/Jul/2012',
      '@timestamp': '2012-07-31T00:00:00.000+0000'
    },
    {
      'message': 'toto'
    },
  ]),
  'missing fields in date': filter_helper.create('regex', '?regex=^(.*)$&fields=timestamp&date_format=HH:mm:ss ZZ', [
    {
      'message': '18:02:28'
    },
  ], [
    {
      'message': '18:02:28',
      '@timestamp': n.format().substring(0, 10) + 'T18:02:28.000+0000'
    },
  ]),
  'change message': filter_helper.create('regex', '?regex=^abcd(.*)efgh$&fields=message', [
    {
      'message': 'abcd12345efgh'
    },
  ], [
    {
      'message': '12345'
    },
  ]),
  'change host': filter_helper.create('regex', '?regex=^(abcd)(.*)efgh$&fields=a,host', [
    {
      'message': 'abcd12345efgh'
    },
  ], [
    {
      'message': 'abcd12345efgh',
      'a': 'abcd',
      'host': '12345'
    },
  ]),
  'nginx parsing': filter_helper.create('regex', '?regex=^(\\S+) - (\\S*) ?- \\[([^\\]]+)\\] "([^"]+)" (\\d+) (\\d+) "([^"]*)" "([^"]*)"&fields=ip,user,timestamp,request,status,bytes_sent,referer,user_agent&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ', [
    {
      'message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'
    },
    {
      'message': '127.0.0.1 - - [31/Jul/2012:18:02:48 +0200] "-" 400 0 "-" "-"'
    },
  ], [
    {
      'message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"',
      'ip': '127.0.0.1',
      'request': 'GET /favicon.ico HTTP/1.1',
      'status': 502,
      'bytes_sent': 574,
      'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2',
      'referer': '-',
      '@timestamp': '2012-07-31T16:02:28.000+0000',
    },
    {
      'message': '127.0.0.1 - - [31/Jul/2012:18:02:48 +0200] "-" 400 0 "-" "-"',
      'ip': '127.0.0.1',
      'request': '-',
      'status': 400,
      'bytes_sent': 0,
      'user_agent': '-',
      'referer': '-',
      '@timestamp': '2012-07-31T16:02:48.000+0000',
    },
  ], function(r) {
    assert.equal(typeof(r[0].status), 'number');
    assert.equal(typeof(r[0].bytes_sent), 'number');
    assert.equal(typeof(r[0].referer), 'string');
  }),
  'http combined with predefined type': filter_helper.create('regex', 'http_combined', [
    {
      'message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'
    },
    {
      'message': '88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"'
    }
  ], [
    {
      'message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"',
      'ip': '127.0.0.1',
      'request': 'GET /favicon.ico HTTP/1.1',
      'status': 502,
      'bytes_sent': 574,
      'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2',
      'referer': '-',
      'user': '-',
      '@timestamp': '2012-07-31T16:02:28.000+0000',
    },
    {
      'message': '88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"',
      'user': 'cdv',
      'bytes_sent': 172,
      'ip': '88.178.233.127',
      'status': 304,
      'referer': '-',
      'user_agent': 'Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07',
      'request': 'GET /public/utils/ejam.jar HTTP/1.1',
      '@timestamp': '2012-10-12T14:23:28.000+0000',
    }
  ]),
  'http vhost combined with predefined type': filter_helper.create('regex', 'http_vhost_combined', [
    {
      'message': 'ip-10-62-95-254.eu-west-1.compute.internal:80 88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"'
    },
    {
      'message': 'www.skillstar.com:80 86.221.21.138 - - [13/Oct/2012:09:04:42 +0200] "GET /favicon.ico HTTP/1.1" 304 0 "-" "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1"'
    },
  ], [
    {
      'message': 'ip-10-62-95-254.eu-west-1.compute.internal:80 88.178.233.127 - cdv [12/Oct/2012:14:23:28 +0000] "GET /public/utils/ejam.jar HTTP/1.1" 304 172 "-" "Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07"',
      'user': 'cdv',
      'bytes_sent': 172,
      'ip': '88.178.233.127',
      'status': 304,
      'referer': '-',
      'user_agent': 'Mozilla/4.0 (Windows 7 6.1) Java/1.7.0_07',
      'request': 'GET /public/utils/ejam.jar HTTP/1.1',
      'vhost': 'ip-10-62-95-254.eu-west-1.compute.internal:80',
      '@timestamp': '2012-10-12T14:23:28.000+0000',
    },
    {
      'message': 'www.skillstar.com:80 86.221.21.138 - - [13/Oct/2012:09:04:42 +0200] "GET /favicon.ico HTTP/1.1" 304 0 "-" "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1"',
      'user': '-',
      'bytes_sent': 0,
      'ip': '86.221.21.138',
      'status': 304,
      'referer': '-',
      'vhost': 'www.skillstar.com:80',
      'user_agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
      'request': 'GET /favicon.ico HTTP/1.1',
      '@timestamp': '2012-10-13T07:04:42.000+0000',
    }
  ]),
}).export(module);
