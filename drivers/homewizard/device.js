'use strict';

const Homey = require('homey');
const { ManagerDrivers } = require('homey');
const drivers = ManagerDrivers.getDriver('homewizard');
const { ManagerI18n } = require('homey');

var homewizard = require('./../../includes/homewizard.js');
var refreshIntervalId;
var homeWizard_devices = {};

var preset_text = '';
var preset_text_nl = ['Thuis', 'Afwezig', 'Slapen', 'Vakantie'];
var preset_text_en = ['Home', 'Away', 'Sleep', 'Holiday'];
var homey_lang = ManagerI18n.getLanguage();

class HomeWizardDevice extends Homey.Device {

	onInit() {

		console.log('HomeWizard Appliance has been inited');

		const devices = drivers.getDevices();

		devices.forEach(function initdevice(device) {
			console.log('add device: ' + JSON.stringify(device.getName()));

			homeWizard_devices[device.getData().id] = {};
			homeWizard_devices[device.getData().id].name = device.getName();
			homeWizard_devices[device.getData().id].settings = device.getSettings();
		});

		homewizard.setDevices(homeWizard_devices);
		homewizard.startpoll();

		if (Object.keys(homeWizard_devices).length > 0) {
		  this.startPolling(devices);
		}

    // Init flow triggers
	  //this._flowTriggerPowerUsed = new Homey.FlowCardTriggerDevice('power_used_changed').register();
		this._flowTriggerPowerNetto = new Homey.FlowCardTriggerDevice('power_netto_changed').register();
  }

  //flowTriggerPowerUsed( device, tokens ) {
	//  this._flowTriggerPowerUsed.trigger( device, tokens ).catch( this.error )
  //  }

	flowTriggerPowerNetto( device, tokens ) {
		this._flowTriggerPowerNetto.trigger( device, tokens ).catch( this.error )
	}


		startPolling(devices) {

		var me = this;

		if (refreshIntervalId) {
			clearInterval(refreshIntervalId);
		}
		refreshIntervalId = setInterval(function () {
			me.log("--Start HomeWizard Polling-- ");
			console.log("--Start HomeWizard Polling-- ");

			me.getStatus(devices);

		}, 1000 * 10);

	}

	getStatus(devices) {
	   	//var homewizard_id = this.getSetting('homewizard_id');
		  //console.log('Devices in getStatus: ' + devices);
			//console.log('Devices in getStatus: ' + devices.getData().id);
			var me = this;

			for (var index in devices) {
				   //homewizard.call(devices[index].getData().id, '/api/v1/data', function(callback) {
			     homewizard.getDeviceData(devices[index].getData().id, 'energylinks', function(callback) {
           //console.log(this);

					 if (Object.keys(callback).length > 0) {
		 		   	try {
 						  me.setAvailable();
							// Parse data from Homewizard Energy
							var metered_gas = callback.total_gas_m3;
							var energy_current_netto = ( callback.active_power_w ); // Netto power usage from aggregated value, this value can go negative
							var metered_electricity_consumed_t1 = callback.total_power_import_t1_kwh;
							var metered_electricity_produced_t1 = callback.total_power_export_t1_kwh;
							var metered_electricity_consumed_t2 = callback.total_power_import_t2_kwh;
							var metered_electricity_produced_t2 = callback.total_power_export_t2_kwh;
							var aggregated_meter_power = (metered_electricity_consumed_t1+metered_electricity_consumed_t2)-(metered_electricity_produced_t1+metered_electricity_produced_t2);

							// Save export data
							if (!me.hasCapability('meter_gas')) {
								me.addCapability('meter_gas');
								me.addCapability('measure_power');
								me.addCapability('meter_power.consumed.t1');
								me.addCapability('meter_power.consumed.t2');
							}

							me.setCapabilityValue("meter_gas", metered_gas);
              me.setCapabilityValue("measure_power", energy_current_netto);
							me.setCapabilityValue("meter_power", aggregated_meter_power);
							me.setCapabilityValue("meter_power.consumed.t1", metered_electricity_consumed_t1);
							me.setCapabilityValue("meter_power.consumed.t2", metered_electricity_consumed_t2);

							// Check if there is production data else ignore
							if (metered_electricity_produced_t1 > 1) {
								if (!me.hasCapability('meter_power.produced.t1')) {
									me.addCapability('meter_power.produced.t1');
									me.addCapability('meter_power.produced.t2');
								}
								me.setCapabilityValue("meter_power.produced.t1", metered_electricity_produced_t1);
								me.setCapabilityValue("meter_power.produced.t2", metered_electricity_produced_t2);
							}
							// Trigger flows
							if (energy_current_netto != me.getStoreValue('last_measure_power_netto') && energy_current_netto != undefined && energy_current_netto != null) {
							  // console.log("Current Netto Power - "+ energy_current_netto);
								me.flowTriggerPowerNetto(me, { netto_power_used: energy_current_netto });
								me.setStoreValue("last_measure_power_netto",energy_current_netto);
							}


						} catch (err) {
							console.log(err);
							me.setUnavailable();
						}
					}
				});
      }
   }
}



module.exports = HomeWizardDevice;
