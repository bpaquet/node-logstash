var vows = require('vows'),
  assert = require('assert'),
  file_filter = require('../lib/lib/file_filter');

vows.describe('File filter').addBatch({
  'simple': {
    check_1: function() {
      var f = file_filter.create('*');
      assert.equal(true, f.filter('toto'));
      assert.equal(true, f.filter('toto.log'));
    },

    check_2: function() {
      var f = file_filter.create('toto.log');
      assert.equal(false, f.filter('toto'));
      assert.equal(true, f.filter('toto.log'));
      assert.equal(false, f.filter('toto1log'));
      assert.equal(false, f.filter('toto.log.2'));
      assert.equal(false, f.filter('atoto.log'));
    },

    check_3: function() {
      var f = file_filter.create('*.log');
      assert.equal(false, f.filter('toto'));
      assert.equal(true, f.filter('toto.log'));
      assert.equal(true, f.filter('toto2.log'));
      assert.equal(false, f.filter('toto2.log.1'));
      assert.equal(false, f.filter('toto25log'));
    },

    check_4: function() {
      var f = file_filter.create('to*to*.log');
      assert.equal(false, f.filter('toto'));
      assert.equal(true, f.filter('toto.log'));
      assert.equal(true, f.filter('toto2.log'));
      assert.equal(true, f.filter('to256775437Uto2.log'));
      assert.equal(false, f.filter('t2oto.log'));
    },

    check_5: function() {
      var f = file_filter.create('toto?.log');
      assert.equal(false, f.filter('toto'));
      assert.equal(false, f.filter('toto.log'));
      assert.equal(true, f.filter('toto2.log'));
      assert.equal(false, f.filter('toto34.log'));
      assert.equal(false, f.filter('toto2log'));
    },

    check_6: function() {
      var f = file_filter.create('to?to?.log');
      assert.equal(false, f.filter('toto'));
      assert.equal(false, f.filter('toto.log'));
      assert.equal(true, f.filter('to3to2.log'));
      assert.equal(false, f.filter('taoto34.log'));
      assert.equal(false, f.filter('to3to2log'));
    },
  }
}).export(module);
