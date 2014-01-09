var agent = require('agent'),
  os = require('os'),
  assert = require('assert');

function createAgent(urls, callback, error_callback) {
  var a = agent.create();
  error_callback = error_callback || function(error) {
    assert.ifError(error);
  };
  a.on('error', function(module_name, error) {
    console.log('Error agent detected, ' + module_name + ' : ' + error);
    if (error_callback) {
      error_callback(error);
    }
  });
  a.start(['filter://add_host://', 'filter://add_timestamp://', 'filter://add_version://'].concat(urls), function(error) {
    assert.ifError(error);
    callback(a);
  });
}

exports.createAgent = createAgent;

function checkResult(line, target, override_host, keep_timestamp) {
  var parsed = JSON.parse(line);
  if (!keep_timestamp) {
    delete parsed['@timestamp'];
  }
  delete parsed.redis_channel;
  if (override_host) {
    target.host = os.hostname();
  }
  assert.deepEqual(parsed, target);
}

exports.checkResult = checkResult;
