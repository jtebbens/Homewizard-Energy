'use strict';

const Homey = require('homey');
const request = require('request');

var devices = {};
var homewizard = require('./../../includes/homewizard.js');
var refreshIntervalId;

class HomeWizardEnergyDriver extends Homey.Driver {
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

        socket.on('manual_add', function (device, callback) {

            var url = 'http://' + device.settings.homewizard_ip + '/' + '/api/v1/data/';

            console.log('Calling '+ url);

            request(url, function (error, response, body) {
                if (response === null || response === undefined) {
                            socket.emit("error", "http error");
                            return;
                }
                if (!error && response.statusCode == 200) {
                    var jsonObject = JSON.parse(body);

                    if (jsonObject.status == 'ok') {
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
            });
        });

        socket.on('disconnect', () => {
            console.log("User aborted pairing, or pairing is finished");
        });
    }



}

module.exports = HomeWizardEnergyDriver;
