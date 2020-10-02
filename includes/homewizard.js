'use strict';

/*
fetch('https://example.com')
.then(res => {
  res.text()       // response body (=> Promise)
  res.json()       // parse via JSON (=> Promise)
  res.status       //=> 200
  res.statusText   //=> 'OK'
  res.redirected   //=> false
  res.ok           //=> true
  res.url          //=> 'https://example.com'
  res.type         //=> 'basic'
                   //   ('cors' 'default' 'error'
                   //    'opaque' 'opaqueredirect')
  res.headers.get('Content-Type')
})
*/



const fetch = require('node-fetch');



const Homey = require('homey');

var debug = false;

module.exports = (function(){
   var homewizard = {};
   var self = {};
   self.devices = [];
   self.polls = [];
   var testdata = {"smr_version": 50,
   "meter_model": "ISKRA  2M550T-101",
   "wifi_ssid": "My Wi-Fi",
   "wifi_strength": 100,
   "total_power_import_t1_kwh": 10830.511,
   "total_power_import_t2_kwh": 2948.827,
   "total_power_export_t1_kwh": 1285.951,
   "total_power_export_t2_kwh": 2876.514,
   "active_power_w": -543,
   "active_power_l1_w": -676,
   "active_power_l2_w": 133,
   "active_power_l3_w": 0,
   "total_gas_m3": 2569.646,
   "gas_timestamp": 210606140010};

   homewizard.debug = false;
   homewizard.debug_devices = [];
   homewizard.debug_devices.HW12345 = {
      id: 'HW12345',
      name: 'HomeWizard',
      settings: {
         homewizard_ip: '192.168.1.123',
         homewizard_pass: 'xxxxx',
         homewizard_ledring: true,
      }
   };
   homewizard.debug_devices_data =  [ { id: 'HW12345' }];

   homewizard.setDevices = function(devices){
      if (homewizard.debug) {
         self.devices = homewizard.debug_devices;
      } else {
         self.devices = devices;
      }
   };

   homewizard.getRandom = function(min, max) {
      return Math.random() * (max - min) + min;
   }

   homewizard.getDevices = function(callback) {
      callback(self.devices);
   };

   homewizard.getDeviceData = function(device_id, data_part, callback) {
     //console.log(self);
      if (typeof self.devices[device_id] === 'undefined' || typeof self.devices[device_id].polldata === 'undefined' || typeof self.devices[device_id].polldata[data_part] === 'undefined') {
         callback([]);
      } else {
         callback(self.devices[device_id].polldata[data_part]);
      }
   };

   homewizard.call = async function(device_id, uri_part, callback) {
         var me = this;
         let status;
         if (debug) {console.log('Call device ' + device_id);}
         if ((typeof self.devices[device_id] !== 'undefined') && ("settings" in self.devices[device_id]) && ("homewizard_ip" in self.devices[device_id].settings)) {
            var homewizard_ip = self.devices[device_id].settings.homewizard_ip;

            const json = await fetch('http://' + homewizard_ip + '/api/v1/data')
            .then((res) => {
              status = res.status;
              return res.json()
            })
            .then((jsonData) => {

              if (status == 200) {
                try {
                      if (jsonData.smr_version != null) {
                         if(typeof callback === 'function') {
                             callback(null, jsonData);
                         } else {
                             console.log('Not typeoffunction');
                         }
                      }
                   } catch (exception) {
                       console.log(exception);
                      console.log('EXCEPTION JSON : '+ body);
                      jsonData = null;
                      callback('Invalid data', []);
                   }
                } else {
                   if(typeof callback === 'function') {
                     callback('Error', []);
                   }
                   console.log('Error: '+error);
                }

            })
            .catch((err) => {
              console.error(err);
            });

         } else {
            console.log('Homewizard '+ device_id +': settings not found!');
         }

   };

   homewizard.ledring_pulse = function(device_id, colorName) {
      var homewizard_ledring =  self.devices[device_id].settings.homewizard_ledring;
      if (homewizard_ledring) {
        Homey.manager('ledring').animate(
            'pulse', // animation name (choose from loading, pulse, progress, solid)
            {
                color: colorName,
            },
            'INFORMATIVE', // priority
            3000, // duration
            function(err, success) { // callback
                if(err) return Homey.error(err);
                console.log("Ledring pulsing "+colorName);
            }
        );
      }
   };

   homewizard.startpoll = function() {
         homewizard.poll();
         self.polls.device_id = setInterval(function () {
            homewizard.poll();
         }, 1000 * 10);
   };

   homewizard.poll = function() {

      if (homewizard.debug) {

         var response = testdata;

         self.devices['HW12345'].polldata = [];
         self.devices['HW12345'].polldata.energylinks = response;

      } else {
         //console.log(self);
         Object.keys(self.devices).forEach(function (device_id) {
            if (typeof self.devices[device_id].polldata === 'undefined') {
               self.devices[device_id].polldata = [];
            }
            homewizard.call(device_id, '/api/v1/data', function(err, response) {
            if (err === null) {
                  self.devices[device_id].polldata.energylinks = response;
               }
            });

         });
      }

   };

   return homewizard;
})();
