'use strict';

const Homey = require('homey');
//const request = require('request');
const fetch = require('node-fetch');


var devices = {};
var homewizard = require('./../../includes/homewizard.js');
var refreshIntervalId;

class HomeWizardDriver extends Homey.Driver {

  onInit() {
      console.log('HomeWizard Energy has been inited');

      var me = this;
  }



    onPair( socket ) {
        // Show a specific view by ID
        socket.showView('start');

        // Show the next view
        socket.nextView();

        // Show the previous view
        socket.prevView();

        // Close the pair session
        socket.done();

        // Received when a view has changed
        socket.on('showView', ( viewId, callback ) => {
            callback();
            console.log('View: ' + viewId);
        });

        socket.on('manual_add', async function (device, callback) {
          let status;
            var url = 'http://' + device.settings.homewizard_ip + '/api/v1/data';

            console.log('Calling '+ url);

            try {
              const json = await fetch(url).then(res => res.json())
              .then((res) => {
                status = res.status;
                return res.json()
                })
                console.log(status);

                if (json.smr_version != null) {
                  console.log('Call OK');

                  devices[device.data.id] = {
                      id: device.data.id,
                      name: device.name,
                      settings: device.settings,
                      capabilities: device.capabilities
                  };
                  homewizard.setDevices(devices);

                  callback( null, devices );
                  socket.emit("success", device);

                }
            }

            catch(err) {
              console.error(err);
              socket.emit("error", "Wrong ipaddress or the dongle does not run firmware 1.48");
            };
        });

        socket.on('disconnect', () => {
            console.log("User aborted pairing, or pairing is finished");
        });
    }



}

module.exports = HomeWizardDriver;
