var util = require('util'),
    url = require('url');

function LogstashEvent(data){
  this.cancelled = false;

  this.data = {
    "@source": "unknown",
    "@tags": [],
    "@fields": {}
  };
  if(typeof data !== 'undefined'){
    for (var i in data) {
      this.data[i] = data[i];
    }
  }
  if(!this.data['@timestamp']) {
    this.data["@timestamp"] = (new Date()).toISOString();
  }
}

LogstashEvent.prototype.getSource = function() {
  return this.data['@source'];
}

LogstashEvent.prototype.setSource = function(val) { 
  var uri = url.parse(val);
  if (typeof uri !== "undefined") {
    this.data["@source"] = val;
    this.data["@source_host"] = uri.host;
    if(uri.path) {
      this.data["@source_path"] = uri.path;
    }
  } else {
    this.data["@source"] = val;
    this.data["@source_host"] = val;
  }
  return this.data['@source'];
}

LogstashEvent.prototype.getTimestamp = function() {
  return this.data['@timestamp'];
}

LogstashEvent.prototype.setTimestamp = function(val) {
  this.data['@timestamp'] = val;
  return this.data['@timestamp'];
}

LogstashEvent.prototype.getSourceHost = function() {
  return this.data['@source_host'];
}

LogstashEvent.prototype.setSourceHost = function(val) {
  this.data['@source_host'] = val;
  return this.data['@source_host'];
}

LogstashEvent.prototype.getSourcePath = function() {
  return this.data['@source_path'];
}

LogstashEvent.prototype.setSourcePath = function(val) {
  this.data['@source_path'] = val;
  return this.data['@source_path'];
}

LogstashEvent.prototype.getMessage = function() {
  return this.data['@message'];
}

LogstashEvent.prototype.setMessage = function(val) {
  this.data['@message'] = val;
  return this.data['@message'];
}

LogstashEvent.prototype.getType = function() {
  return this.data['@type'];
}

LogstashEvent.prototype.setType = function(val) {
  this.data['@type'] = val;
  return this.data['@type'];
}

LogstashEvent.prototype.getTags = function() {
  return this.data['@tags'];
}

LogstashEvent.prototype.setTags = function(val) {
  this.data['@tags'] = val;
  return this.data['@tags'];
}

LogstashEvent.prototype.toJSON = function() {
  return this.data;
}

LogstashEvent.prototype.getField = function(key) {
  if(!(key in this.data["@fields"]) && key.substring(0,1) == "@") {
    return this.data[key];
    // Exists in @fields (returns value) or doesn't start with "@" (return null)
  } else {
    return this.data["@fields"][key];
  }
}

LogstashEvent.prototype.setField = function(key,value) {
  if(key in this.data) {
    this.data[key] = value;
  } else {
    this.data["@fields"][key] = value;
  }
}

LogstashEvent.prototype.sprintf = function(format) {
  // TODO: Placeholder to be implimented later.
  return format;
}

LogstashEvent.prototype.clone = function() {
  return new LogstashEvent(this.data);
}

exports.create = function(data) {
  return new LogstashEvent(data);
}

exports.fromJSON = function(raw) {
  var data = JSON.parse(raw)
  return new LogstashEvent(data);
}
