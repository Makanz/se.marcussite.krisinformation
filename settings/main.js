function onHomeyReady(Homey) {

    Homey.ready();

    var citiesElement = document.getElementById('citiesList')
    var addCityElement = document.getElementById('addCityBtn')
    var saveElement = document.getElementById('saveBtn');

    Homey.get('cities', function (err, cities) {
        if (err) return Homey.alert(err);
        JSON.parse(cities).forEach(function (i) {
            createInputElement(i);
        });
    });

    addCityElement.addEventListener('click', function(e){
        createInputElement();
    });

    function createInputElement(value) {
        console.log("createInputElement", createInputElement);
        var li = document.createElement("li");

        var input = document.createElement("input");
        input.type = "text";
        input.className = "city"; 
        if(value != undefined)
            input.value = value;
        li.appendChild(input);
        citiesElement.appendChild(li);
    }

    saveElement.addEventListener('click', function (e) {
        var cityElements = document.querySelectorAll('input.city');
        var citiesArray = [];
        cityElements.forEach(function(item) {
            if(item.value !== "")
                citiesArray.push(item.value);
        })

        console.log(citiesArray)
        console.log(JSON.stringify(citiesArray))

        Homey.set('cities', JSON.stringify(citiesArray), function (err) {
            if (err) return Homey.alert(err);
        });

        Homey.alert("Settings saved!");
    });
}