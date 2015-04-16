var base_input = require('../lib/base_input'),
  util = require('util'),
  async = require('../lib/async'),
  logger = require('log4node');

var Collector = require('node-sflow');
var Cap = require('cap').Cap,
    decoders = require('cap').decoders,
    PROTOCOL = decoders.PROTOCOL;

function TCPUDPHelper(ret,buffer){
  var tcpudpheader;

  if (ret.info.protocol === PROTOCOL.IP.TCP) {

    ret = decoders.TCP(buffer, ret.offset);
    tcpudpheader = ret.info;
    tcpudpheader.type = "TCP";


  } else if (ret.info.protocol === PROTOCOL.IP.UDP) {

    ret = decoders.UDP(buffer, ret.offset);
    tcpudpheader = ret.info;
    tcpudpheader.type = "UDP";
  }
  return tcpudpheader;

}

function InputSFlow() {
  base_input.BaseInput.call(this);
  this.mergeConfig(this.unserializer_config());
  this.mergeConfig({
    name: 'SFlow',
    host_field: 'host',
    port_field: 'port',
    start_hook: this.start
  });
}

util.inherits(InputSFlow, base_input.BaseInput);

InputSFlow.prototype.start = function(callback) {
  logger.info('Start listening on sflow (udp):' + this.port);
  this.counter = 0;
  this.current = {};

  this.parser = function(flow) {

    if (flow && flow.flow.records && flow.flow.records.length>0) {
      for (var i = 0; i < flow.flow.records.length; i++) {
        var n = flow.flow.records[i];
        if (n.type == 'raw') {
          if (n.protocolText == 'ethernet') {

            var buffer = n.header;
            var ret = decoders.Ethernet(buffer, 0);
            var ethheader = ret.info;
            var ipheader;
            var tcpudpheader;

            if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {

              ret = decoders.IPV4(buffer, ret.offset);
              ipheader = ret.info;
              tcpudpheader = TCPUDPHelper(ret,buffer);


            } else if (ret.info.type === PROTOCOL.ETHERNET.IPV6) {

              ret = decoders.IPV6(buffer, ret.offset);
              ipheader = ret.info;
              tcpudpheader = TCPUDPHelper(ret,buffer);


            } else {
              console.log('Unsupported Ethertype: ' + PROTOCOL.ETHERNET[ret.info.type]);
            }

            n.header = ['decoded'];
            n.ethheader = ethheader;
            n.ipheader = ipheader;
            n.tcpudpheader = tcpudpheader;

          }
        }
        flow.flow.records[i] = n;
        var recorddesignator = 'record' + i;
        flow.flow[recorddesignator] = {};
        var t = flow.flow[recorddesignator];
        t.eth = n.ethheader;
        t.ip = n.ipheader;
        t.l4 = n.tcpudpheader;
        flow.flow.records.splice(i, 1);

      }
    }
    this.emit('data', flow);
  }.bind(this);

  this.collector = Collector(this.parser);

  this.collector.listen(this.port);

  callback();
};

InputSFlow.prototype.close = function(callback) {
  logger.info('Closing listening sflow (udp):' + this.port);
  async.eachSeries(Object.keys(this.current), function(x, callback) {
    var c = this.current[x];
    c.once('close', callback);
    c.end();
  }.bind(this), async.chainedCloseAll([this.server], callback));
};

exports.create = function() {
  return new InputSFlow();
};
