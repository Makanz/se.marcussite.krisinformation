function onHomeyReady(Homey) {
    // ...

    //Homey.ready();

    var cityElements = document.querySelectorAll('input.city');
    var addCityElement = document.getElementById('addCityBtn')
    var saveElement = document.getElementById('saveBtn');
/*
    Homey.get('cities', function (err, username) {
        if (err) return Homey.alert(err);
        usernameElement.value = username;
    });
*/
    saveElement.addEventListener('click', function (e) {
/*
        Homey.set('cities', usernameElement.value, function (err) {
            if (err) return Homey.alert(err);
        });
*/
    });
}


onHomeyReady();