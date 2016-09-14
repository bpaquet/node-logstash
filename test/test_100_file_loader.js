/* jshint unused:false */
var vows = require('vows'),
  assert = require('assert'),
  file_loader = require('lib/file_loader');

vows.describe('File loader').addBatch({
  'simple': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/simple', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['input://stdin://']);
    }
  },

  'multiple': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/multiple', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['input://stdin://a', 'input://stdin://b', 'input://stdin://c']);
    }
  },

  'comment': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/comment', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['output://stdout://']);
    }
  },

  'file not found': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/comment2', this.callback);
    },
    check: function(err, result) {
      assert.isDefined(err);
      assert.match(err.toString(), /ENOENT/);
    }
  },

  'loadDirectory': {
    topic: function() {
      file_loader.loadDirectory('test/file_loader_test', this.callback);
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, ['output://stdout://', 'input://stdin://a', 'input://stdin://b', 'input://stdin://c', 'input://stdin://']);
    }
  },

  'directory not found': {
    topic: function() {
      file_loader.loadDirectory('test/file_loader_test2', this.callback);
    },

    check: function(err, result) {
      assert.isDefined(err);
      assert.match(err.toString(), /ENOENT/);
    }
  },

  'empty standard': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/empty', false, this.callback);
    },
    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, []);
    }
  },

  'empty': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/empty', true, this.callback);
    },
    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, []);
    }
  },

  'empty spaces': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/empty_spaces', true, this.callback);
    },
    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, []);
    }
  },

  'only one cr': {
    topic: function() {
      file_loader.loadFile('test/file_loader_test/only_one_cr', true, this.callback);
    },
    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, []);
    }
  },


}).export(module);
