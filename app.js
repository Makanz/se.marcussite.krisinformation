'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');
const md5 = require('md5');

const trigger_alert = "krisinformation_trigger_alert";

const cronName = "crisisInformationCronTask"
const cronInterval = "0 */5 * * * *"; // "*/10 * * * * *"; 

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
		let warningsHistorySettingsString = Homey.ManagerSettings.get('warningsHistory');

		let cities = (IsJsonString(citiesSettingsString)) ? JSON.parse(citiesSettingsString) : [];
		let warningsHistory = (IsJsonString(warningsHistorySettingsString)) ? JSON.parse(warningsHistorySettingsString) : [];

		if (cities !== []) {
			fetch('http://api.krisinformation.se/v1/feed?format=json')
				.then(response => response.json())
				.then(json => json.Entries)
				.then(data => {
					let warnings = data.filter(item => {
							return searchForCity(item, cities);
						})
						.map(item => {
							return {
								Hash: md5(item.Summary.substring(0, 10) + item.ID),
								Title: item.Title,
								Message: item.Summary
							}
						})
						.filter(item => {
							// Check if it's in history
							return warningsHistory.indexOf(item.Hash) === -1
						})

					console.log("Searching for:", cities)
					console.log("Found:", warnings)

					if(warnings.length > 0) { 
						// Add hash to history
						warningsHistory.push(warnings[0].Hash)

						// Save history
						Homey.ManagerSettings.set('warningsHistory', JSON.stringify(warningsHistory))

						// Trigger first warning found
						krisinformationTrigger.trigger(warnings[0])
					}
				})
		}
	}
}

function searchForCity(item, cities) {
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
	if(str === null || str === undefined)
		return false;
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

module.exports = Krisinformation;