var map;
var infowindow;

function initialize() {
    var startLocation = new google.maps.LatLng(49.80868, -97.1367);

    var mapOptions = {
        center: startLocation,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
    };
    map = new google.maps.Map(document.getElementById("mapCanvas"), mapOptions);

    var request = {
        location: startLocation,
        radius: 5000,
        types: ['gas_station']
    };
    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
}

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var price = getRandomPrice();
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: 'http://maps.google.com/mapfiles/ms/icons/' + getColorFromPrice(price) + '-dot.png'
    });

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent('<div class="fillUpHere">' + place.name + '<br/>'
            + price + ' cents/L<br/>'
            + '<button onclick="fillUp(' + price + ', \'' + place.name + '\');">Fill up here</button>');
        infowindow.open(map, this);
    });
}

function getColorFromPrice(price) {
    if (price > 112)
        return 'red';
    else if (price > 108)
        return 'yellow';
    else
        return 'green';
}

function getRandomPrice() {
    var max = 115;
    var min = 105;
    return (Math.random() * (max - min) + min).toFixed(1);
}

function fillUp(price, name) {
    infowindow.setContent('<div class="fillUp">' + '<div class="stationName">' + name + '</div>'
            + price + ' cents/L<br/>'
            + 'Amount: <input type="number" value="40" min="0" max="40" required=""> Litres<br/>'
            + 'Odometer: <input type="number" value="158741" min="0" max="999999" required=""> km<br/>'
            + 'Price: $<input type="number" value="' + price + '" min="0" step="0.1" style="width: 70px" required="">/Litre<br/>'
            + '<button onclick="doneFillUp(' + price + ', \'' + name + '\');">Done</button>'
            + '<button onclick="doneFillUp(' + price + ', \'' + name + '\');">Cancel</button></div>');
}

function doneFillUp(price, name) {
    infowindow.setContent(name + '<br/>'
            + price + ' cents/L<br/>'
            + '<button onclick="fillUp(' + price + ', \'' + name + '\');">Fill up here</button>');
}

google.maps.event.addDomListener(window, 'load', initialize);

$('#maintenanceButton').click(function () {
    $('#maintenanceWindow').toggle();
    $('#statisticsWindow').hide();
    $('#overlay').show();
});

$('#statisticsButton').click(function () {
    $('#statisticsWindow').toggle();
    $('#maintenanceWindow').hide();
    $('#overlay').show();
});

$('#addMaintenanceButton').click(function () {
    $('#addMaintenanceWindow').show();
    $('#overlay').css('z-index', 3);
});

$('#doneAddMaintenanceButton').click(function () {
    $('#addMaintenanceWindow').hide();
    $('#overlay').css('z-index', 1);
});

$('#cancelAddMaintenanceButton').click(function () {
    $('#addMaintenanceWindow').hide();
    $('#overlay').css('z-index', 1);
});

$('#overlay').click(function () {
    $('#maintenanceWindow').hide();
    $('#addMaintenanceWindow').hide();
    $('#statisticsWindow').hide();
    $('#overlay').hide();
    $('#overlay').css('z-index', 1);
});

$('#maintenanceWindow .closeButton').click(function () {
    $('#maintenanceWindow').hide();
    $('#overlay').hide();
});

$('#addMaintenanceWindow .closeButton').click(function () {
    $('#addMaintenanceWindow').hide();
    $('#overlay').css('z-index', 1);
});

$('#statisticsWindow .closeButton').click(function () {
    $('#statisticsWindow').hide();
    $('#overlay').hide();
});

$('#menuButton').click(function () {
    $('#sideBar').toggleClass('hidden');
});

new Chart(document.getElementById("chart").getContext("2d")).Line({
    labels : ["November","December","January","February","March","April","May","June","July","August","September","October"],
    datasets: [
        {
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: [14.5,14.8,14.7,14.5,14.9,15,14.8,15.5,15.8,16,16.3,17.4]
        }
    ]
}, {
    scaleFontColor: "#fff",
    scaleLineColor: "rgba(255,255,255,.2)",
    scaleGridLineColor: "rgba(255,255,255,.1)"
});

var ViewModel = function(vehicles) {
    var self = this;

    self.vehicles = ko.observableArray(ko.utils.arrayMap(vehicles, function(vehicle) {
        return {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            photo: vehicle.photo,
            maintenance: ko.observableArray(vehicle.maintenance),
            upcomingMaintenance: vehicle.upcomingMaintenance,
            l100kmMonth: vehicle.l100kmMonth,
            l100kmYear: vehicle.l100kmYear
        };
    }));
    self.selectedVehicle = ko.observable(1);
    self.newMaintenance = ko.observable({
        name: ko.observable(""),
        type: ko.observable("duration"),
        months: ko.observable(""),
        startingDate: ko.observable(""),
        kms: ko.observable(""),
        startingKms: ko.observable("")
    });

    self.setVehicle = function(vehicle) {
        return function() {
            self.selectedVehicle(vehicle);
        }
    }
    self.getMaintenanceDescription = function(maintenance) {
        var description = maintenance.name + " every ";

        if (maintenance.months !== undefined)
            description += maintenance.months + " months";
        else
            description += maintenance.kms + " km";

        return description;
    }
    self.addMaintenance = function() {
        var newMaintenance = self.newMaintenance();
        var maintenance = {
            name: newMaintenance.name()
        }; 

        if (newMaintenance.type() === "duration") {
            maintenance.months = newMaintenance.months();
            maintenance.startingDate = newMaintenance.startingDate();
        } else {
            maintenance.kms = newMaintenance.kms();
            maintenance.startingKms = newMaintenance.startingKms();
        }

        self.vehicles()[self.selectedVehicle()].maintenance.push(maintenance);
        self.clearAddMaintenance();
    };
    self.clearAddMaintenance = function() {
        var newMaintenance = self.newMaintenance();

        newMaintenance.name("");
        newMaintenance.type("duration");
        newMaintenance.months("");
        newMaintenance.startingDate("");
        newMaintenance.kms("");
        newMaintenance.startingKms("");
    };

};

$.getJSON("defaults.json", function(defaults) {
    ko.applyBindings(new ViewModel(defaults));
});

