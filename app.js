'use strict';

const Homey = require('homey');

const fetch = require('node-fetch');

const trigger_alert = "krisinformation_trigger_alert";

const cities = [
	'Helsingborg',
	'Höganäs',
	'Östergötlands län'
];

class Krisinformation extends Homey.App {

	onInit() {
		this.log('Krisinformation is running...')

		// Register FlowCardTrigger
		krisinformationTrigger = new Homey.FlowCardTrigger(trigger_alert).register();

	}

	getCrisisInformation() {

		let apiFetch = fetch('http://api.krisinformation.se/v1/feed?format=json')
			.then(response => response.json())
			.then(json => json.Entries)
			.then(data => {
				let warnings = data.filter(item => {
						return searchForCity(item);
					})
					.map(item => {
						return {
							Updated: item.Updated,
							Published: item.Published,
							Title: item.Title,
							Text: item.Summary
						}
					})

				console.log(warnings)
			})

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
	}
}

module.exports = Krisinformation;