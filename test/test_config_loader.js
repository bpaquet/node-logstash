var vows = require('vows'),
    assert = require('assert'),
    config_loader = require('config_loader');

vows.describe('Config loader :').addBatch({
  'empty config': {
    topic: function() {
      var callback = this.callback;
      config_loader.load('configs/empty', function(err, result) {
        callback(err, result);
      });
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, {input: {}, output: {}});
    }
  },

  'parse error': {
    topic: function() {
      var callback = this.callback;
      config_loader.load('configs/parse_error', function(err, result) {
        callback(err, result);
      });
    },

    check: function(err, result) {
      assert.ifError(!err);
    }
  },

  'simple config': {
    topic: function() {
      var callback = this.callback;
      config_loader.load('configs/simple', function(err, result) {
        callback(err, result);
      });
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, {
        "output": {"stdout": []},
        "input": {
          "file": [
            {
              "type": "titi",
              "path": "/toto.log"
            },
            {
              "type": "titi",
              "path": "/tata.log"
            }
          ]
        }
      });
    }
  },

  'merge config': {
    topic: function() {
      var callback = this.callback;
      config_loader.load('configs/merge', function(err, result) {
        callback(err, result);
      });
    },

    check: function(err, result) {
      assert.ifError(err);
      assert.deepEqual(result, {
        "output": {"stdout": []},
        "input": {
          "file": [
            {
              "type": "titi",
              "path": "/tata.log"
            },
            {
              "path": "/toto.log"
            }
          ]
        }
      });
    }
  },

}).export(module);
