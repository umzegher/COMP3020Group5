$(function() {
    var viewModel;

    google.maps.event.addDomListener(window, 'load', function() {
        var startLocation = new google.maps.LatLng(49.80868, -97.1367);

        var mapOptions = {
            center: startLocation,
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        var map = new google.maps.Map(document.getElementById("mapCanvas"), mapOptions);

        var request = {
            location: startLocation,
            radius: 5000,
            types: ['gas_station']
        };

        var infoWindow = new google.maps.InfoWindow();
        infoWindow.setContent(
            '<div id="fillUp">' +
                '<div data-bind="text: name"></div>' +
                '<div data-bind="visible: !fillUpFormVisible()">' +
                    '<div data-bind="text: price() + \' cents/L\'"></div>' +
                    '<button data-bind="click: function() {fillUpFormVisible(true)}">Buy gas here</button>' +
                '</div>' +
                '<form data-bind="visible: fillUpFormVisible, submit: fillUp">' +
                    'Amount: <input type="number" min="0" max="40" data-bind="value: amount" required autofocus> Litres<br/>' +
                    'Odometer: <input type="number" min="0" max="999999" data-bind="value: odometer" required> km<br/>' +
                    'Price: <input type="number" min="0" step="0.1" style="width: 70px" data-bind="value: price" required> cents/L<br/>' +
                    '<button type="submit">Done</button>' +
                    '<button type="button" data-bind="click: clearFillUp">Cancel</button>' +
                '</form>' +
            '</div>');

        // once the InfoWindow is loaded tell Knockout to parse the bindings
        google.maps.event.addListener(infoWindow, 'domready', function() {
            ko.applyBindings(viewModel, document.getElementById("fillUp"));
        });

        function createMarker(place, price) {
            var marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                icon: getIconFromPrice(price)
            });

            google.maps.event.addListener(marker, 'click', function() {
                viewModel.name(place.name);
                viewModel.price(price);

                infoWindow.open(map, this);
            });
        }

        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    createMarker(results[i], getRandomPrice());
                }
            }
        });

        var legend = document.getElementById('legend');
        $.each(defaults.icons, function(i, icon) {
            var div = document.createElement('div');
            div.innerHTML = '<img src="' + icon.src + '"> ' + icon.name;
            legend.appendChild(div);
        });

        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    });

    function getIconFromPrice(price) {
        var found = "";
        $.each(defaults.icons, function(i, icon) {
            if (icon.maxPrice == undefined || icon.maxPrice >= price) {
                found = icon.src;
                return false;
            }
        });
        return found;
    }

    function getRandomPrice() {
        var max = 115;
        var min = 105;
        return (Math.random() * (max - min) + min).toFixed(1);
    }

    var ViewModel = function(defaults) {
        var self = this;

        self.vehicles = ko.observableArray(ko.utils.arrayMap(defaults.vehicles, function(vehicle) {
            return {
                make: ko.observable(vehicle.make),
                model: ko.observable(vehicle.model),
                year: ko.observable(vehicle.year),
                photo: ko.observable("images/" + vehicle.photo),
                maintenance: ko.observableArray(vehicle.maintenance),
                upcomingMaintenance: vehicle.upcomingMaintenance,
                l100kmMonth: vehicle.l100kmMonth,
                l100kmYear: vehicle.l100kmYear,
                fillUps: ko.observableArray(vehicle.fillUps),
                added: true
            };
        }));
        self.selectedVehicle = ko.observable();
        self.newMaintenance = ko.observable({
            name: ko.observable(""),
            type: ko.observable("duration"),
            months: ko.observable(""),
            startingDate: ko.observable(""),
            kms: ko.observable(""),
            startingKms: ko.observable("")
        });
        self.newVehicle = ko.observable();

        self.maintenanceWindowVisible = ko.observable(false);
        self.addMaintenanceWindowVisible = ko.observable(false);
        self.historyWindowVisible = ko.observable(false);
        self.statisticsWindowVisible = ko.observable(false);
        self.addVehicleWindowVisible = ko.observable(false);
        self.anyWindowVisible = function() {
            return self.maintenanceWindowVisible() || self.addMaintenanceWindowVisible() || self.historyWindowVisible() ||
                    self.statisticsWindowVisible() || self.addVehicleWindowVisible();
        };
        self.closeTopWindow = function() {
            if (self.addMaintenanceWindowVisible()) {
                self.addMaintenanceWindowVisible(false);
            } else {
               self.maintenanceWindowVisible(false);
               self.historyWindowVisible(false);
               self.statisticsWindowVisible(false);
               self.addVehicleWindowVisible(false);
            }
        };

        self.sideBarVisible = ko.observable(false);
        self.toggleSideBar = function() {
            self.sideBarVisible(!self.sideBarVisible());
        };

        self.name = ko.observable();
        self.price = ko.observable();
        self.amount = ko.observable(40);
        self.odometer = ko.observable();
        self.fillUpFormVisible = ko.observable();

        var chart = new Chart(document.getElementById("chart").getContext("2d"))
        self.statsInterval = ko.observable();
        self.statsInterval.subscribe(function(newInterval) {
            chart.Line({
                labels : defaults.statistics[newInterval].labels,
                datasets: [
                    {
                        fillColor: "rgba(151,187,205,0.5)",
                        strokeColor: "rgba(151,187,205,1)",
                        pointColor: "rgba(151,187,205,1)",
                        pointStrokeColor: "#fff",
                        data: defaults.statistics[newInterval].data
                    }
                ]
            }, {
                scaleOverride: true,
                scaleSteps: 16,
                scaleStepWidth: 0.25,
                scaleStartValue: 14,
                scaleFontColor: "#fff",
                scaleLineColor: "rgba(255,255,255,.2)",
                scaleGridLineColor: "rgba(255,255,255,.1)"
            });
        });

        self.setVehicle = function(vehicle) {
            return function() {
                self.selectedVehicle(vehicle);

                var fillups = vehicle.fillUps();
                if (fillups === undefined || fillups.length === 0)
                    self.odometer(0);
                else
                    self.odometer(fillups[fillups.length-1].odometer);
            }
        };
        self.setVehicle(self.vehicles()[1])();
        self.getMaintenanceDescription = function(maintenance) {
            var description = maintenance.name + " every ";

            if (maintenance.months !== undefined)
                description += maintenance.months + " months";
            else
                description += maintenance.kms + " km";

            return description;
        };
        self.getHistoryDescription = function(history) {
            return history.amount + " litres at " + history.price + " cents/L on " + history.date;
        };
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

            self.selectedVehicle().maintenance.push(maintenance);
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

            self.addMaintenanceWindowVisible(false);
        };

        self.addVehicle = function() {
            var newVehicle = self.newVehicle();
            var file = $('#photo').get(0).files[0];
            var createVehicle = function(e) {
                if (e) // if a photo is selected
                    newVehicle.photo(e.target.result);

                if (!newVehicle.added) {
                    newVehicle.added = true;
                    self.vehicles.push(newVehicle);
                }
                self.clearAddVehicle();
            };

            if (file && file.type.match('image')) {
                var reader = new FileReader();
                reader.onload = createVehicle;
                reader.readAsDataURL(file);
            } else {
                createVehicle();
            }
        };
        self.clearAddVehicle = function() {
            self.newVehicle({
                make: ko.observable(""),
                model: ko.observable(""),
                year: ko.observable(2013),
                photo: ko.observable("images/noimage.jpg"),
                maintenance: ko.observableArray([]),
                upcomingMaintenance: [],
                l100kmMonth: 0,
                l100kmYear: 0,
                fillUps: ko.observableArray([]),
                added: false
            });

            self.addVehicleWindowVisible(false);
        };
        self.clearAddVehicle();
        self.deleteVehicle = function(vehicle) {
            return function() {
                var index = self.vehicles().indexOf(vehicle);
                self.vehicles.splice(index, 1);
                self.clearAddVehicle();
            };
        };

        self.validatePhoto = function(data, event) {
            var input = event.target;
            if (input.files[0].type.match('image'))
                input.setCustomValidity("");
            else
                input.setCustomValidity("File must be an image");
        };
        self.editVehicle = function(vehicle) {
            return function() {
                self.newVehicle(vehicle);
                self.addVehicleWindowVisible(true);
            };
        };

        self.fillUp = function() {
            self.selectedVehicle().fillUps.push({
                amount: self.amount(),
                odometer: self.odometer(),
                price: self.price(),
                date: new Date().toJSON().split('T')[0]
            });

            self.clearFillUp();
        };
        self.clearFillUp = function() {
            self.amount(40);
            self.fillUpFormVisible(false);
        };
        self.deleteFillUp = function(fillUp) {
            return function() {
                var index = self.selectedVehicle().fillUps().indexOf(fillUp);
                self.selectedVehicle().fillUps.splice(index, 1);
            };
        };
    };

    viewModel = new ViewModel(window.defaults);
    ko.applyBindings(viewModel);
});
