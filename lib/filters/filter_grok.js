var base_filter = require('../lib/base_filter'),
  file_loader = require('../lib/file_loader'),
  patterns_loader = require('../lib/patterns_loader'),
  util = require('util'),
  logger = require('log4node'),
  regex_helper = require('../lib/regex_helper'),
  OnigRegExp = require('oniguruma').OnigRegExp;

var onload_callbacks = [];
var loaded = false;
var global_patterns;

function processLines(lines) {
  var patterns = {};
  lines.forEach(function(line) {
    // the first space is the separator
    var sepIndex = line.indexOf(' ');
    if (sepIndex === -1) {
      // no space, invalid pattern definition
      logger.error('Invalid grok pattern definition "' + line + '"');
      return;
    }
    var name = line.substring(0, sepIndex);
    // remove all unnamed capturing groups from the pattern
    patterns[name] = line.substring(sepIndex + 1).trim().replace(/\((?!\?)/g, '(?:');
  });
  return patterns;
}

function loadPatterns(callback) {
  var _leave = function(err) {
    loaded = true;
    onload_callbacks.forEach(function(cb) {
      setImmediate(function() {
        cb(err);
      });
    });
    onload_callbacks = [];
  };
  if (loaded) {
    return callback();
  }
  onload_callbacks.push(callback);
  if (onload_callbacks.length > 1) {
    return;
  }
  logger.info('Loading grok patterns');
  patterns_loader.loadGrokPatterns(function(err, lines) {
    if (err) {
      return _leave(err);
    }
    var patterns = processLines(lines);
    logger.info('Grok patterns loaded from patterns directories', Object.keys(patterns).length);
    global_patterns = patterns;
    _leave();
  });
}

function FilterGrok() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig(regex_helper.config());
  this.mergeConfig({
    name: 'Grok',
    host_field: '',
    allow_empty_host: true,
    required_params: ['grok'],
    optional_params: ['extra_patterns_file'],
    default_values: {
    },
    config_hook: this.loadPatterns,
    start_hook: this.start
  });
}

util.inherits(FilterGrok, base_filter.BaseFilter);

FilterGrok.prototype.expandGrokPattern = function(regex, extra_patterns) {
  var offset = 0;
  var reduced = regex;
  var result;
  var grokFinder = new OnigRegExp('%{[^}]+}');
  var grokParts = new RegExp('%{([^:]+):?(.*)}');

  while ((result = grokFinder.searchSync(regex, offset))) {
    offset = result[0].end;
    var grokExp = result[0].match;
    var parts = grokExp.match(grokParts);

    var p = global_patterns[parts[1]] || extra_patterns[parts[1]];
    if (p) {
      if (parts[2].length > 0) {
        this.fields.push(parts[2]);
      }
      var reg = this.expandGrokPattern(p, extra_patterns);
      if (parts[2].length > 0) {
        // create a named capturing group
        reg = '(?<' + parts[2] +  '>' + reg + ')';
      }
      // replace the grok expression with the regular expression
      reduced = reduced.replace(grokExp, reg);
    }
    else {
      throw new Error('Unable to find grok pattern ' + parts[1]);
    }
  }

  return reduced;
};

FilterGrok.prototype.start = function(callback) {
  logger.info('Initializing grok filter, pattern: ' + this.grok);

  this.fields = [];

  this.post_process = regex_helper.process.bind(this);

  var _done = function(extra_patterns) {
    try {
      var expanded = this.expandGrokPattern(this.grok, extra_patterns);
      this.regex = new OnigRegExp(expanded);
    }
    catch(e) {
      logger.error('Unable to process grok pattern', this.grok, e);
      return callback(e);
    }
    callback();
  }.bind(this);

  loadPatterns(function(err) {
    if (err) {
      return callback(err);
    }
    if (this.extra_patterns_file) {
      logger.info('Loading extra pattern file', this.extra_patterns_file);
      file_loader.loadFile(this.extra_patterns_file, function(err, lines) {
        if (err) {
          return callback(err);
        }
        _done(processLines(lines));
      }.bind(this));
    }
    else {
      _done({});
    }
  }.bind(this));
};

FilterGrok.prototype.process = function(data) {
  logger.debug('Trying to match on grok', this.grok, ', input', data.message);
  var result = this.regex.searchSync(data.message);
  if (result) {
    for (var i = 0; i < this.fields.length; i++) {
      this.post_process(data, result[i + 1].match, i);
    }
  }
  return data;
};

exports.create = function() {
  return new FilterGrok();
};
