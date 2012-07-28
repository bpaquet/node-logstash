var vows = require('vows'),
    assert = require('assert'),
    config_loader = require('config_loader');

vows.describe('Config loader :').addBatch({
  'empty config': {
    topic: function() {
      var callback = this.callback;
      config_loader.load_directory('configs/empty', function(err, result) {
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
      config_loader.load_directory('configs/parse_error', function(err, result) {
        callback(err, result);
      });
    },

    check: function(err, result) {
      assert.ifError(!err);
    }
  },

  'parse error on a single file': {
    topic: function() {
      var callback = this.callback;
      config_loader.load_file('configs/parse_error/toto.json', function(err, result) {
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
      config_loader.load_directory('configs/simple', function(err, result) {
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

'simple config on a single file': {
    topic: function() {
      var callback = this.callback;
      config_loader.load_file('configs/simple/toto.json', function(err, result) {
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
      config_loader.load_directory('configs/merge', function(err, result) {
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
