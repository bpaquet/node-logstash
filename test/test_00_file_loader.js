var vows = require('vows'),
    assert = require('assert'),
    file_loader = require('../lib/lib/file_loader');

vows.describe('File loader').addBatch({
  'simple': {
    topic: function() {
      file_loader.loadFile('file_loader_test/simple', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['input://stdin://']);
    }
  },

  'multiple': {
    topic: function() {
      file_loader.loadFile('file_loader_test/multiple', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['input://stdin://a', 'input://stdin://b', 'input://stdin://c']);
    }
  },

  'comment': {
    topic: function() {
      file_loader.loadFile('file_loader_test/comment', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['output://stdout://']);
    }
  },

  'file not found': {
    topic: function() {
      file_loader.loadFile('file_loader_test/comment2', this.callback);
    },

    check: function(err, result) {
      assert.ok(err);
      assert.ok(err.toString().match(/ENOENT/), 'Match failed on ' + err.toString());
    }
  },

  'loadDirectory': {
    topic: function() {
      file_loader.loadDirectory('file_loader_test', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['output://stdout://', 'input://stdin://a', 'input://stdin://b', 'input://stdin://c', 'input://stdin://']);
    }
  },

  'directory not found': {
    topic: function() {
      file_loader.loadDirectory('file_loader_test2', this.callback);
    },

    check: function(err, result) {
      assert.ok(err);
      assert.ok(err.toString().match(/ENOENT/), 'Match failed on ' + err.toString());
    }
  },

}).export(module);