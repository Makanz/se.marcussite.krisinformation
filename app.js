'use strict';

const Homey = require('homey');

const fetch = require('node-fetch');

const trigger_alert = "krisinformation_trigger_alert";

const cronName = "crisisInformationCronTask"
const cronInterval = "*/10 * * * * *"; // "0 */5 * * * *";

let krisinformationTrigger;

class Krisinformation extends Homey.App {

	onInit() {
		this.log('Krisinformation is running...')

		// Register FlowCardTrigger
		krisinformationTrigger = new Homey.FlowCardTrigger(trigger_alert).register();

		// Register crontask
		Homey.ManagerCron.getTask(cronName)
			.then(task => {
				this.log("The task exists: " + cronName);
				task.on('run', () => this.checkCrisisInformation());
			})
			.catch(err => {
				if (err.code == 404) {
					this.log("The task has not been registered yet, registering task: " + cronName);
					Homey.ManagerCron.registerTask(cronName, cronInterval, null)
						.then(task => {
							task.on('run', () => this.checkCrisisInformation());
						})
						.catch(err => {
							this.log(`problem with registering cronjob: ${err.message}`);
						});
				} else {
					this.log(`other cron error: ${err.message}`);
				}
			});

		// Run on unload
		Homey
			.on('unload', () => {
				Homey.ManagerCron.unregisterTask(cronName);
			});

	}

	checkCrisisInformation() {

		let citiesSettingsString = Homey.ManagerSettings.get('cities');

		let cities = (IsJsonString(citiesSettingsString)) ? JSON.parse(citiesSettingsString) : undefined;

		if (cities !== undefined) {
			fetch('http://api.krisinformation.se/v1/feed?format=json')
				.then(response => response.json())
				.then(json => json.Entries)
				.then(data => {
					let warnings = data.filter(item => {
							return searchForCity(item);
						})
						.map(item => {
							return {
								// Updated: item.Updated,
								// Published: item.Published,
								Title: item.Title,
								Message: item.Summary
							}
						})

					console.log("Searching for:", cities)
					console.log("Found:", warnings)
					if(warnings.length > 0)
						krisinformationTrigger.trigger(warnings[0])
				})
		}

		function searchForCity(item) {
			let found = false;
			cities.forEach(city => {
				if (item.Title.toLowerCase().indexOf(city.toLowerCase()) > -1)
					found = true;
				if (item.Summary.toLowerCase().indexOf(city.toLowerCase()) > -1)
					found = true;
				item.CapArea.forEach(area => {
					if (area.CapAreaDesc.toLowerCase().indexOf(city.toLowerCase()) > -1)
						found = true;
				})
			})
			return found;
		}

		function IsJsonString(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}
	}
}

module.exports = Krisinformation;