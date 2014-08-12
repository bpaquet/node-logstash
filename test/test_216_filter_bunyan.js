var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter bunyan').addBatch({
  'normal': filter_helper.create('bunyan', '', [
    {
      'message': '{"name":"myapp","hostname":"banquise.local","pid":6442,"level":30,"msg":"hi","time":"2014-05-31T20:32:53.902Z","v":0}'
    },
  ], [
    {
      message: 'hi',
      bunyan_app_name: 'myapp',
      bunyan_version: 0,
      host: 'banquise.local',
      '@timestamp': '2014-05-31T20:32:53.902Z',
      pid: 6442,
      bunyan_level_name: 'INFO',
      bunyan_level: 30,
    },
  ]),
}).export(module);
