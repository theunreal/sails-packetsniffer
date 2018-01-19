/**
 * ApplicationsController
 *
 * @description :: Server-side logic for managing applications
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var rp = require('request-promise');

module.exports = {

  getTicket: function(req,res) {
    var options = {
      method: 'POST',
      uri: 'https://devnetapi.cisco.com/sandbox/apic_em/api/v1/ticket',
      body: {
        "username": "devnetuser",
        "password": "Cisco123!"
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then(function (result) {
        res.json(result.response.serviceTicket);
      })
      .catch(function (err) {
        res.json(err);
      });
  },

  getHost: function (req,res) {
    var options = {
      uri: 'https://devnetapi.cisco.com/sandbox/apic_em/api/v1/host',
      headers: {
        'X-Auth-Token': req.param("ticket")
      },
      json: true // Automatically parses the JSON string in the response
    };

    rp(options)
      .then(function (repos) {
        res.json(repos);
      })
      .catch(function (err) {
        res.json(err);
      });
  },

  getNetworkDevice: function (req,res) {
    var options = {
      uri: 'https://devnetapi.cisco.com/sandbox/apic_em/api/v1/network-device',
      headers: {
        'X-Auth-Token': req.param("ticket")
      },
      json: true // Automatically parses the JSON string in the response
    };

    rp(options)
      .then(function (repos) {
        res.json(repos);
      })
      .catch(function (err) {
        res.json(err);
      });
  }
};

