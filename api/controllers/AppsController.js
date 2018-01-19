/**
 * AppsController
 *
 * @description :: Server-side logic for managing apps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Cap = require('cap').Cap;
var parser = require('ua-parser-js');

module.exports = {
  interfaces: function (req, res) {
    res.json(Cap.deviceList());
  },

  adirectory: function (req,res) {
    console.log('Searching for user...');
    var ActiveDirectory = require('activedirectory');
    var config = { url: 'ldap://ada-aln1-c1-11.cisco.com',
      baseDN: 'CN=eelnasi,OU=Employees,OU=Cisco Users,DC=cisco,DC=com',
      username: 'eelnasi@cisco.com',
      password: 'El462855!' }

    var ad = new ActiveDirectory(config);
    var username = 'eelnasi@cisco.com';
    var password = 'El462855!';

    ad.authenticate(username, password, function(err, auth) {
      if (err) {
        console.log('ERROR: ' + JSON.stringify(err));
        return;
      }

      if (auth) {
        ad.findUser('eelnasi', function(err, result) {
          res.json(result);
        })
      }
    })
  },

  obd: function (req,res) {
    var OBDReader = require('bluetooth-obd');
    var btOBDReader = new OBDReader();
    var dataReceivedMarker = {};

    btOBDReader.on('connected', function () {
      //this.requestValueByName("vss"); //vss = vehicle speed sensor

      this.addPoller("vss");
      this.addPoller("rpm");
      this.addPoller("temp");
      this.addPoller("load_pct");
      this.addPoller("map");
      this.addPoller("frp");

      this.startPolling(1000); //Request all values each second.
    });

    btOBDReader.on('dataReceived', function (data) {
      console.log(data);
      dataReceivedMarker = data;
    });

// Use first device with 'obd' in the name
    btOBDReader.autoconnect('V-LINK');
  },

  collect: function (req, res) {
    var iface = req.param("iface");
    var port = req.param("port");


    var decoders = require('cap').decoders,
    PROTOCOL = decoders.PROTOCOL;

var c = new Cap(),
    device = Cap.findDevice(iface),
    filter = 'tcp and dst port ' + port,
    bufSize = 10 * 1024 * 1024,
    buffer = new Buffer(65535);

if (device) {

  var linkType = c.open(device, filter, bufSize, buffer);

  c.setMinBytes && c.setMinBytes(0);

  c.on('packet', function (nbytes, trunc) {


    if (linkType === 'ETHERNET') {
      var ret = decoders.Ethernet(buffer);

      if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {
        // console.log('Decoding IPv4 ...');

        ret = decoders.IPV4(buffer, ret.offset);
        // console.log('from: ' + ret.info.srcaddr + ' to ' + ret.info.dstaddr);

        if (ret.info.protocol === PROTOCOL.IP.TCP) {
          var datalen = ret.info.totallen - ret.hdrlen;

          // console.log('Decoding TCP ...');

          ret = decoders.TCP(buffer, ret.offset);
          // console.log(' from port: ' + ret.info.srcport + ' to port: ' + ret.info.dstport);
          datalen -= ret.hdrlen;
          const offset = buffer.toString('binary', ret.offset, ret.offset + datalen);
          console.log(offset);
          if (offset) {
            var agent = offset.split('User-Agent:');
            if (agent[1]) {
              agent = agent[1].split('\n');
              agent = agent[0].substring(1);
            }
            var host = offset.split('Host:');
            if (host[1]) {
              host = host[1].split('\n');
              host = host[0].substring(1);
              if (host.length) {
                sails.sockets.blast('message', {"host": host, "size": nbytes, "agent": parser(agent)});
              }
            }
          }
        } else if (ret.info.protocol === PROTOCOL.IP.UDP) {
          console.log('Decoding UDP ...');

          ret = decoders.UDP(buffer, ret.offset);
          console.log(' from port: ' + ret.info.srcport + ' to port: ' + ret.info.dstport);
          console.log(buffer.toString('binary', ret.offset, ret.offset + ret.info.length));
        } else
          console.log('Unsupported IPv4 protocol: ' + PROTOCOL.IP[ret.info.protocol]);
      } else
        console.log('Unsupported Ethertype: ' + PROTOCOL.ETHERNET[ret.info.type]);
    }
  });
} else {
  res.send('none');
}

  },


};

