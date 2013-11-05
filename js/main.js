var map;
var infowindow;

function initialize() {
    var startLocation = new google.maps.LatLng(49.80868, -97.1367);

    var mapOptions = {
        center: startLocation,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
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
        infowindow.setContent(place.name + '<br/>' + price + ' cents/L<br/>'
            + '<button onclick="fillUp(' + price + ');">Fill up here</button>');
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

function fillUp(price) {
    $('#fillUpPrice').val(price);
    $('#addFillUp').show();
}

google.maps.event.addDomListener(window, 'load', initialize);

$('#doneFillUp').click(function () {
    $('#addFillUp').hide();
});

$('#cancelFillUp').click(function () {
    $('#addFillUp').hide();
});

$('.carPickerItem').click(function (e) {
    $('.carPickerItem').removeClass('active');
    $(e.target).addClass('active');
    $('#carInfo #carModel').text($(e.target).text());
});
