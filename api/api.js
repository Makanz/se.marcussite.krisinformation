const fetch = require('node-fetch')

const cities = [
    'Helsingborg',
    'Höganäs',
    'Östergötlands län'
]

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
        if(item.Title.toLowerCase().indexOf(city.toLowerCase()) > -1)
            found = true;
        if(item.Summary.toLowerCase().indexOf(city.toLowerCase()) > -1)
            found = true;
        item.CapArea.forEach(area => {
            if(area.CapAreaDesc.toLowerCase().indexOf(city.toLowerCase()) > -1)
                found = true;
        })
    })
    return found;
}