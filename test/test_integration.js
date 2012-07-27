var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    agent = require('agent'),
    Log4Node = require('log4node');

function cmp_without_timestamp(line, target) {
  var parsed = JSON.parse(line);
  delete parsed['@timestamp'];
  assert.deepEqual(parsed, target);
}

vows.describe('Integation :').addBatch({
  'file2file': {
    topic: function() {
      var callback = this.callback;
      agent.on('error', function(module_name, index, error) {
        assert.ifError(error);
      });
      agent.emit('set_logger', new Log4Node('info'));
      agent.emit('load_config_from_directory', 'configs/file2file');
      setTimeout(function() {
        fs.appendFileSync('input1.txt', 'line1\n');
        setTimeout(function() {
          fs.appendFileSync('input2.txt', 'line2\n');
          setTimeout(function() {
            fs.appendFileSync('input1.txt', 'line3\n');
            setTimeout(function() {
              callback(null);
            }, 100);
          }, 30);
        }, 30);
      }, 100);
    },

    check: function() {
      var c1 = fs.readFileSync('output1.txt').toString();
      var c2 = fs.readFileSync('output2.txt').toString();
      assert.equal(c1, c2);
      var splitted = c1.split('\n');
      assert.equal(splitted.length, 4);
      assert.equal("", splitted[splitted.length - 1]);
      cmp_without_timestamp(splitted[0], {'@source': 'input1.txt', '@message': 'line1'});
      cmp_without_timestamp(splitted[1], {'@source': 'input2.txt', '@message': 'line2', '@type': 'input2'});
      cmp_without_timestamp(splitted[2], {'@source': 'input1.txt', '@message': 'line3'});
      fs.unlinkSync('input1.txt');
      fs.unlinkSync('input2.txt');
      fs.unlinkSync('output1.txt');
      fs.unlinkSync('output2.txt');
    }
  },

}).export(module);
