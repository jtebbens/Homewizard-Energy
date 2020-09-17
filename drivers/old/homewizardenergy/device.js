'use strict';

const Homey = require('homey');
const { ManagerDrivers } = require('homey');
const drivers = ManagerDrivers.getDriver('homewizardenergy');
const { ManagerI18n } = require('homey');



var homewizard = require('./../../includes/homewizard.js');

var refreshIntervalId;
var refreshIntervalIdReadings;
var homeWizard_devices = {};

class HomeWizardEnergy extends Homey.Device {

	onInit() {

		console.log('HomeWizard Energy '+this.getName() +' has been inited');
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

	 this.startPolling();

		// Init flow triggers
		this._flowTriggerPowerUsed = new Homey.FlowCardTriggerDevice('power_used_changed').register();
		//this._flowTriggerPowerNetto = new Homey.FlowCardTriggerDevice('power_netto_changed').register();
		//this._flowTriggerPowerS1 = new Homey.FlowCardTriggerDevice('power_s1_changed').register();
		//this._flowTriggerMeterPowerS1 = new Homey.FlowCardTriggerDevice('meter_power_s1_changed').register();
		//this._flowTriggerPowerS2 = new Homey.FlowCardTriggerDevice('power_s2_changed').register();
		//this._flowTriggerMeterPowerS2 = new Homey.FlowCardTriggerDevice('meter_power_s2_changed').register();
		//this._flowTriggerMeterPowerUsed = new Homey.FlowCardTriggerDevice('meter_power_used_changed').register();
		//this._flowTriggerMeterPowerAggregated = new Homey.FlowCardTriggerDevice('meter_power_aggregated_changed').register();

	}

	flowTriggerPowerUsed( device, tokens ) {
		this._flowTriggerPowerUsed.trigger( device, tokens ).catch( this.error )
	}

	//flowTriggerPowerNetto( device, tokens ) {
	//	this._flowTriggerPowerNetto.trigger( device, tokens ).catch( this.error )
	//}

	//flowTriggerPowerS1( device, tokens ) {
	//	this._flowTriggerPowerS1.trigger( device, tokens ).catch( this.error )
  //}

	//flowTriggerMeterPowerS1( device, tokens ) {
	//	this._flowTriggerMeterPowerS1.trigger( device, tokens ).catch( this.error )
	//}

	//flowTriggerPowerS2( device, tokens ) {
	//	this._flowTriggerPowerS2.trigger( device, tokens ).catch( this.error )
	//}

	//flowTriggerMeterPowerS2( device, tokens ) {
	//	this._flowTriggerMeterPowerS2.trigger( device, tokens ).catch( this.error )
	//}
	//flowTriggerMeterPowerUsed( device, tokens ) {
	//	this._flowTriggerMeterPowerUsed.trigger( device, tokens ).catch( this.error )
	//}

	//flowTriggerMeterPowerAggregated( device, tokens ) {
	//	this._flowTriggerMeterPowerAggregated.trigger( device, tokens ).catch( this.error )
	//}

	startPolling() {

		var me = this;

		if (refreshIntervalId) {
			clearInterval(refreshIntervalId);
		}
		refreshIntervalId = setInterval(function () {

	   	console.log("--Start Homewizard Energy Polling-- ");
			console.log(me.getSetting('homewizard_id'));

			if(me.getSetting('homewizard_id') !== undefined ) {
				console.log('Poll for '+me.getName());

				me.getStatus();
			}
     me.getStatus();
		}, 1000 * 10); // Every 10 seconds poll
	}

	getStatus() {
		var homewizard_id = this.getSetting('homewizard_id');
    console.log('Homewizard_id: ' + homewizard_id);

		var me = this;

		homewizard.getDeviceData(homewizard_id, 'test', function(callback) {
    if (Object.keys(callback).length > 0) {
 		   try {

					// Parse data from Homewizard Energy
					var metered_gas = callback.total_gas_m3;
					var metered_electricity_consumed_t1 = callback.total_power_import_t1_kwh;
					var metered_electricity_produced_t1 = callback.total_power_export_t1_kwh;
					var metered_electricity_consumed_t2 = callback.total_power_import_t2_kwh;
					var metered_electricity_produced_t2 = callback.total_power_export_t2_kwh;

					// Save export data
					me.setCapabilityValue("meter_gas.reading", metered_gas);
					me.setCapabilityValue("meter_power.consumed.t1", metered_electricity_consumed_t1);
					me.setCapabilityValue("meter_power.produced.t1", metered_electricity_produced_t1);
					me.setCapabilityValue("meter_power.consumed.t2", metered_electricity_consumed_t2);
					me.setCapabilityValue("meter_power.produced.t2", metered_electricity_produced_t2);

					var energy_current_netto = ( callback.active_power_w ); // Netto power usage from aggregated value, this value can go negative

					// Some Energylink do not have gas information so try to get it else fail silently
					try {
						var gas_daytotal_cons = ( callback.total_gas_m3 ); // m3 Energy produced via S1 $energylink[0]['gas']['dayTotal']
						// Consumed gas
						me.setCapabilityValue("meter_gas", gas_daytotal_cons);
					}
					catch(err) {
						// Error with Energylink no data in Energylink
						console.log ("No Gas information found");
					}

					// Consumed elec current


					// Trigger flows
					if (energy_current_netto != me.getStoreValue('last_measure_power_netto') && energy_current_netto != undefined && energy_current_netto != null) {
					    console.log("Current Netto Power - "+ energy_current_netto);
						me.flowTriggerPowerNetto(me, { netto_power_used: energy_current_netto });
						me.setStoreValue("last_measure_power_netto",energy_current_netto);
					}


				} catch (err) {
					console.log(err);
				}
       }
		});
	}


	onDeleted() {

		clearInterval(refreshIntervalId);
		clearInterval(refreshIntervalIdReadings);
		console.log("--Stopped Polling--");
		console.log('deleted: ' + JSON.stringify(this));

	}

}

module.exports = HomeWizardEnergy;
