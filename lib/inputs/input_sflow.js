var base_input = require('../lib/base_input'),
  net = require('net'),
  tls = require('tls'),
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


  } else if (ret.info.protocol === PROTOCOL.IP.UDP) {

    ret = decoders.UDP(buffer, ret.offset);
    tcpudpheader = ret.info;

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
  logger.info('Start listening on tcp', this.host + ':' + this.port);
  this.counter = 0;
  this.current = {};

  var listener = function(c) {
    var local_id = this.counter;
    this.counter += 1;
    this.current[local_id] = c;
    c.on('data', function(data) {
      this.unserialize_data(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        var obj = {
          'message': data.toString().trim(),
          'host': c.remoteAddress,
          'tcp_port': this.port,
          'type': this.type,
        };
        if (this.ssl && this.appendPeerCert) {
          var peer_cert = c.getPeerCertificate();
          obj.tls = {
            'authorized': c.authorized,
            'peer_cert': {
              'subject': peer_cert.subject,
              'issuer': peer_cert.issuer,
              'valid_from': peer_cert.valid_from,
              'valid_to': peer_cert.valid_to,
              'fingerprint': peer_cert.fingerprint,
            }
          };
        }
        this.emit('data', obj);
      }.bind(this));
    }.bind(this));
    c.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
    c.on('close', function() {
      delete this.current[local_id];
    }.bind(this));
  }.bind(this);


    this.server = net.createServer(listener);

  Collector(function(flow) {
    if (flow && flow.flow.records && flow.flow.records.length>0) {
      for (var i = 0; i < flow.flow.records.length; i++) {
        var n = flow.flow.records[i];
        if (n.type == 'raw') {
          if (n.protocolText == 'ethernet') {
            //try {
            //console.log(n.header);
            var buffer = n.header;
            var ret = decoders.Ethernet(buffer, 0);
            var ethheader = ret.info;
            var ipheader;
            var tcpudpheader;

            if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {

              ret = decoders.IPV4(buffer, ret.offset);
              ipheader = ret.info;
              tcpudpheader = TCPUDP(ret,buffer);


            } else if (ret.info.type === PROTOCOL.ETHERNET.IPV6) {

              ret = decoders.IPV6(buffer, ret.offset);
              ipheader = ret.info;
              tcpudpheader = TCPUDP(ret,buffer);


            } else {
              console.log('Unsupported Ethertype: ' + PROTOCOL.ETHERNET[ret.info.type]);
            }

            n.header = ['decoded'];
            n.ethheader = ethheader;
            n.ipheader = ipheader;
            n.tcpudpheader = tcpudpheader;

            //}
            //catch(e) {
            //  console.log(e);
            //}
          }
        }
        flow.flow.records[i] = n;
      }
    }
    console.log(JSON.stringify(flow,null,2));
  }).listen(this.port);


  this.server.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.server.listen(this.port, this.host);

  this.server.once('listening', callback);
};

InputSFlow.prototype.close = function(callback) {
  logger.info('Closing listening tcp', this.host + ':' + this.port);
  async.eachSeries(Object.keys(this.current), function(x, callback) {
    var c = this.current[x];
    c.once('close', callback);
    c.end();
  }.bind(this), async.chainedCloseAll([this.server], callback));
};

exports.create = function() {
  return new InputSFlow();
};
