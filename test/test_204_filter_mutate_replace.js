var vows = require('vows'),
  filter_helper = require('./filter_helper');

vows.describe('Filter replace ').addBatch({
  'nothing': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{}], [{}]),
  'normal': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{
    'toto': 'my.domain'
  }], [{
    'toto': 'my-domain'
  }]),
  'float': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{
    'toto': 10.42
  }], [{
    'toto': '10-42'
  }]),
  'multiple': filter_helper.create('mutate_replace', 'toto?from=\\.&to=-', [{
    'toto': 'my.domain.com'
  }], [{
    'toto': 'my-domain-com'
  }]),
  'type_filtering': filter_helper.create('mutate_replace', 'toto?only_type=titi&from=\\.&to=-', [
    {
      'type': 'titi',
      'toto': 'my.domain.com'
    },
    {
      'toto': 'my.domain2.com'
    }
  ], [
    {
      'type': 'titi',
      'toto': 'my-domain-com'
    },
    {
      'toto': 'my.domain2.com'
    }
  ]),
}).export(module);
