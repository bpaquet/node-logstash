var vows = require('vows'),
  assert = require('assert'),
  patterns_loader = require('../lib/lib/patterns_loader'),
  filter_helper = require('./filter_helper');

patterns_loader.add('lib/patterns');
patterns_loader.add('lib/toto');

vows.describe('Filter grok ').addBatch({
  'normal': filter_helper.create('grok', '?match=%{NUMBER:fnumber} %{WORD:fword} %{GREEDYDATA:fgreedy}', [
    {
      'message': '123 abc def jhi'
    },
  ], [
    {
      'message': '123 abc def jhi',
      'fnumber': 123,
      'fword': 'abc',
      'fgreedy': 'def jhi'
    },
  ]),
  'same type': filter_helper.create('grok', '?match=%{NUMBER:fn1} %{NUMBER:fn2} %{NUMBER:fn3}', [
    {
      'message': '123 456 789'
    },
  ], [
    {
      'message': '123 456 789',
      'fn1': 123,
      'fn2': 456,
      'fn3': 789
    },
  ], function(r) {
    assert.equal(typeof(r[0].fn1), 'number');
    assert.equal(typeof(r[0].fn2), 'number');
    assert.equal(typeof(r[0].fn3), 'number');
  }),
  'haproxy': filter_helper.create('grok', '?match=%{HAPROXYHTTP}', [
    {
      'message': 'Sep 14 02:01:37 lb haproxy[11223]: 127.0.0.1:12345 [14/Sep/2014:02:01:37.452] public nginx/server1 0/0/0/5/5 200 490 - - ---- 1269/1269/0/1/0 0/0 "GET /my/path HTTP/1.1"'
    },
  ], [
    {
      'message': 'Sep 14 02:01:37 lb haproxy[11223]: 127.0.0.1:12345 [14/Sep/2014:02:01:37.452] public nginx/server1 0/0/0/5/5 200 490 - - ---- 1269/1269/0/1/0 0/0 "GET /my/path HTTP/1.1"',
      'syslog_timestamp': 'Sep 14 02:01:37',
      'syslog_server': 'lb',
      'program': 'haproxy',
      'pid': 11223,
      'client_ip': '127.0.0.1',
      'client_port': 12345,
      'accept_date': '14/Sep/2014:02:01:37.452',
      'haproxy_monthday': 14,
      'haproxy_month': 'Sep',
      'haproxy_year': 2014,
      'haproxy_time': '02:01:37',
      'haproxy_hour': 2,
      'haproxy_minute': 1,
      'haproxy_second': 37,
      'haproxy_milliseconds': 452,
      'frontend_name': 'public',
      'backend_name': 'nginx',
      'server_name': 'server1',
      'time_request': 0,
      'time_queue': 0,
      'time_backend_connect': 0,
      'time_backend_response': 5,
      'time_duration': 5,
      'http_status_code': 200,
      'bytes_read': 490,
      'captured_request_cookie': '-',
      'captured_response_cookie': '-',
      'termination_state': '----',
      'actconn': 1269,
      'feconn': 1269,
      'beconn': 0,
      'srvconn': 1,
      'retries': 0,
      'srv_queue': 0,
      'backend_queue': 0,
      'http_verb': 'GET',
      'http_request': '/my/path',
      'http_version': 1.1
    },
  ]),
  'extra patterns': filter_helper.create('grok', '?match=%{GROKTEST}&extra_patterns_file=' + __dirname + '/grok/extra', [
    {
      'message': '123 abc def jhi ABC123'
    },
  ], [
    {
      'message': '123 abc def jhi ABC123',
      'fnumber': 123,
      'fword': 'abc',
      'fgreedy': 'def jhi',
      'ftestpattern': 'ABC123'
    },
  ]),
  'wrong grok pattern syntax error': filter_helper.create('grok', '?match=%{GROKTEST3}&extra_patterns_file=' + __dirname + '/grok/extra', [
    {
      'message': 'toto'
    },
  ], [
    {
      'message': 'toto',
      tags: ['_grokparsefailure'],
    }
  ]),
  'parse ok 1': filter_helper.create('grok', '?match=%{IP}&add_tags=x&add_fields=a:#{host}&remove_field=error', [
    {
      'message': '1.2.3.4',
      'host': 'titi',
      'error': 'a',
    },
  ], [
    {
      'message': '1.2.3.4',
      'host': 'titi',
      'tags': ['x'],
      'a': 'titi'
    }
  ]),
  'parse ok 2': filter_helper.create('grok', '?match=%{IP}&add_tags=x,t&add_field=a:#{host},b:2&remove_fields=toto,error', [
    {
      'message': '1.2.3.4',
      'host': 'titi',
      'error': 'a',
    },
  ], [
    {
      'message': '1.2.3.4',
      'host': 'titi',
      'tags': ['x', 't'],
      'a': 'titi',
      'b': 2,
    }
  ]),
  'parse error 1': filter_helper.create('grok', '?match=%{IP}&tag_on_failure=&add_tags=y,t&add_tags=x&add_fields=a:#{host}&remove_field=error', [
    {
      'message': 'toto',
      'error': 'a',
      'tags': ['x'],
    },
  ], [
    {
      'message': 'toto',
      'error': 'a',
      'tags': ['x'],
    }
  ]),
  'parse error 2': filter_helper.create('grok', '?match=%{IP}&tag_on_failure=a,b&remove_tags=y&add_tags=x&add_fields=a:#{host}&remove_field=error', [
    {
      'message': 'toto',
      'error': 'a',
      'tags': ['x', 'y'],
    },
  ], [
    {
      'message': 'toto',
      'error': 'a',
      'tags': ['x', 'y', 'a', 'b'],
    }
  ]),
}).export(module);
