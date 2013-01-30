var m = require('module');

var original_loader = null;
var original_cache = null;
var mocked_modules = [];

function mocked_loader(request, parent, isMain) {
  if (mocked_modules[request]) {
    return mocked_modules[request];
  }
  return original_loader(request, parent, isMain);
}

function mock(modules) {
  // console.log('Wrapping original loader');
  original_loader = m._load;
  original_cache = m._cache;
  
  m._load = mocked_loader;
  m._cache = {};
  mocked_modules = modules
}

function unmock() {
  // console.log('Restoring original loader');
  m._load = original_loader;
  m._cache = original_cache;
}

exports.unmock = unmock;

exports.mock = mock;
