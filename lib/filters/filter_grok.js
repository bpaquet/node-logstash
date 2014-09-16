var base_filter = require('../lib/base_filter'),
  file_loader = require('../lib/file_loader'),
  util = require('util'),
  logger = require('log4node'),
  path = require('path'),
  fs = require('fs'),
  OnigRegExp = require('oniguruma').OnigRegExp;

function FilterGrok() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'Grok',
    host_field: '',
    allow_empty_host: true,
    required_params: ['grok'],
    optional_params: ['extra_patterns'],
    default_values: {
    },
    config_hook: this.loadPatterns,
    start_hook: this.start
  });
}

util.inherits(FilterGrok, base_filter.BaseFilter);

FilterGrok.prototype.loadPatterns = function(callback) {

  var _done = function() {
    this.regex = new OnigRegExp(this.expand(this.grok));
    callback();
  }.bind(this);

  this.grokFinder = new OnigRegExp('%{[^}]+}');
  this.grokParts = new RegExp('%{([^:]+):?(.*)}');
  this.patterns = {};
  this.fields = [];

  var defaultPatterns = path.resolve(__dirname, '../patterns/grok');
  logger.debug('loading default grok patterns');
  file_loader.loadDirectory(defaultPatterns, function(err, lines) {
    if (err) {
      callback(err);
      return;
    }
    this.processPatterns(lines);
    if (this.extra_patterns) {
      logger.info('Loading grok patterns from file ' + this.extra_patterns);
      file_loader.loadFile(this.extra_patterns, function(err, lines) {
        if (err) {
          callback(err);
          return;
        }
        this.processPatterns(lines);
        _done();
      }.bind(this));
    } else {
      _done();
    }
  }.bind(this));
};

FilterGrok.prototype.processPatterns = function(lines) {
  var line = lines.shift();
  if (!line) {
    return;
  }

  // process the pattern
  // the first space is the separator
  var sepIndex = line.indexOf(' ');
  if (sepIndex === -1) {
    // no space, invalid pattern definition
    logger.error('invalid pattern definition "' + line + '"');
    this.processPatterns(lines);
    return;
  }

  var name = line.substring(0, sepIndex);
  // remove all unnamed capturing groups from the pattern
  this.patterns[name] = line.substring(sepIndex + 1).trim().replace(/\((?!\?)/g, '(?:');
  this.processPatterns(lines);
}

FilterGrok.prototype.expand = function(pattern) {
  var offset = 0;
  var reduced = pattern;
  var result;
  while ((result = this.grokFinder.searchSync(pattern, offset))) {
    offset = result[0].end;
    var grokExp = result[0].match;
    var parts = grokExp.match(this.grokParts);
    if (this.patterns[parts[1]]) {
      if (parts[2].length > 0) {
        this.fields.push(parts[2]);
      }
      var reg = this.expand(this.patterns[parts[1]]);
      if (parts[2].length > 0) {
        // create a named capturing group
        reg = '(?<'+parts[2]+ '>'+reg+')';
      }
      // replace the grok expression with the regular expression
      reduced = reduced.replace(grokExp, reg);
    }
  }

  return reduced;
}

FilterGrok.prototype.start = function(callback) {
  logger.info('Initializing grok filter, pattern: ' + this.grok);
  callback();
};

FilterGrok.prototype.process = function(data) {
  logger.debug('Trying to match on grok', this.grok, ', input', data.message);
  var result = this.regex.searchSync(data.message);
  if (result) {
    for (var i = 0; i < this.fields.length; i++) {
      var v = result[i + 1];
      data[this.fields[i]] = v.match;
    }
  }
  return data;
};

exports.create = function() {
  return new FilterGrok();
};
