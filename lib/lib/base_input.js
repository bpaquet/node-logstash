var base_component = require('./base_component'),
    util = require('util'),
    logger = require('log4node'),
    logstash_event = require('../lib/logstash_event');

function BaseInput() {
  base_component.BaseComponent.call(this);
}

util.inherits(BaseInput, base_component.BaseComponent);

BaseInput.prototype.init = function(url) {
  logger.info('Initializing input', this.config.name);

  this.loadConfig(url, function(err) {
    if (err) {
      this.emit('init_error', err);
      return;
    }

    this.emit('init_ok');
  }.bind(this));
}

BaseInput.prototype.toEvent = function(raw, source) {
  logger.debug('creating logstash event', {raw: raw, source: source});
  if(typeof this.format === "undefined") { this.format = "plain" }

  var event = logstash_event.create();
  if(Array.isArray(this.tags)) {
    event.setTags(this.tags.slice(0));//deep copy of array
  }
  event.setSource(source);

  switch(this.format) {
    case "plain":
      event.setMessage(raw);
      break;
    case "json":
      try {
        var fields = JSON.parse(raw)
        for (var f in fields) {
          event.setField(f, fields[f]);
        }
        if(typeof this.message_format !== "undefined") {
          //event.message = event.sprintf(@message_format)
        } else {
          event.setMessage(raw);
        }
      } catch(e) {
        // TODO(sissel): Instead of dropping the event, should we treat it as
        // plain text and try to do the best we can with it?
        logger.warning("Trouble parsing json input, falling back to plain text", {input: raw,
                      source: source, exception: e,
                      backtrace: e.backtrace});
        event.setMessage(raw);
      }
      break;
    case "json_event":
      try {
        event = logstash_event.fromJSON(raw);
        // if(this.message_format && !event.getMessage()) {
        //   event.message = event.sprintf(this.message_format);
        // }
      }
      catch(e) {
        logger.warning("Trouble parsing json input, falling back to plain text",
                     {'input': raw, 'source': source, 'exception': e});
        event.setMessage(raw);
      }
      
      if(event.getSource() == "unknown") {
        event.setSource(source);
      }
      break;
    default:
      //raise "unknown event format #{@format}, this should never happen"
      break;
  }

  if(typeof event.getType() === "undefined") { event.setType(this.type); }

  // @add_field.each do |field, value|
  //    event[field] ||= []
  //    event[field] = [event[field]] if !event[field].is_a?(Array)
  //    event[field] << event.sprintf(value)
  // end

  logger.debug(["New event created", {source: source, event_data: event}]);
  return event;
}

exports.BaseInput = BaseInput;
