"use strict";

const Homey = require('homey');

class HomeWizardEnergyApp extends Homey.App {
	onInit() {
		console.log("HomeWizard Energy app ready!");
	}
}

module.exports = HomeWizardEnergyApp;
