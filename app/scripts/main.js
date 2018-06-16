// Whole-script strict mode syntax
'use strict';

var map;

// Create a blank array for all team markers
var markers = [];

// Create placemarkers array to use in functions that serach for places
var placeMarkers = [];

// Create a global variable for a single infowindow to be used with the place details information
// so that only one is open at once
var placeInfoWindow;

function initMap() {
    // Constructor creates a new map and centers on Chicago
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 41.897745, lng: -87.645179},
      zoom: 12,
      mapTypeControl: false
    });

    var largeInfowindow = new google.maps.InfoWindow();

    // Create an array of team markers on initialize
    var i = 0;
    for(var t in teamsJson) {
        // Get the latlong for the venue
        var position = teamsJson[t].venueLocation;
        var title = t;
        // Create a marker for each venue
        var svg = teamsJson[t].logo;
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new google.maps.Size(60, 60) },
            animation: google.maps.Animation.DROP,
            id: i
        });
        // Push marker to the global team markers array
        markers.push(marker);
        // Create an onclick event to open an infowindow at each marker and bounce marker once
        marker.addListener('click', function() {
            viewModel.goToTeam(this.title);
            populateInfoWindow(this, largeInfowindow);
            var that = this;
            this.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                that.setAnimation(null);
            }, 700);
        });
        i++;
    }

    // Display all team markers on initialize
    showMarkers();

    // Create a searchbox for executing places search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });
    
    // Event listener for prediction list selection
    searchBox.addListener('places_changed', function() {
        searchBoxPlaces(this);
    });

    // This function populates the infowindow when the marker is clicked
    function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            // Clear the infowindow content
            infowindow.setContent('');
            infowindow.marker = marker;
            // Make sure the marker property is cleared if the infowindow is closed
            infowindow.addListener('closeclick', function(){
                infowindow.marker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                                    nearStreetViewLocation, marker.position);
                    infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                            document.getElementById('pano'), panoramaOptions);
                } else {
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
            }
            // Use streetview to get the closest streetview image within 50 meters
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
            // Open the infowindow on the correct marker
            infowindow.open(map, marker);
        }
    }

    // This function fires when users selects a serchbox item,
    // It will do a nearby search using the selected query string or place
    function searchBoxPlaces() {
        hideMarkers(placeMarkers);
        var places = searchBox.getPlaces();
        // For each place, get the icon, name and location
        createMarkersForPlaces(places);
        if (places.length == 0) {
            window.alert('We did not find any places matching that search!');
        }
    }
}

// This function fires when the user hits the 'Go' button for places search
function textSearchPlaces(place) {
    if (place == '') {
        window.alert('Please enter a place!');
    } else {
        var bounds = map.getBounds();
        hideMarkers(placeMarkers);
        var placesService = new google.maps.places.PlacesService(map);
        placesService.textSearch({
            query: place,
            bounds: bounds
        }, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                createMarkersForPlaces(results);
            }
        });
    }
}

// This functions creates markers for each place found in places search
// The second 'bp' flag is used when function is called on team selection
// It is used for the viewModel to create bar and parking locations dropdown lists
function createMarkersForPlaces(places, bp) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });
        // Initiate the global infowindow variable
        placeInfoWindow = new google.maps.InfoWindow();
        // If a marker is clicked, do a place details search on it
        marker.addListener('click', function() {
            if (placeInfoWindow.marker == this) {
                console.log("This infowindow already is on this marker!")
            } else {
                var that = this;
                this.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    that.setAnimation(null);
                }, 700);
                getPlacesDetails(this, placeInfoWindow);
            }
        });
        placeMarkers.push(marker);
        if (bp == 1) {
            viewModel.bars.push(marker);
        }
        if (bp == 2) {
            viewModel.parking.push(marker);
        }
        if (place.geometry.viewport) {
            // Only geocodes have viewport
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
    viewModel.showClearButton(true);
}

// This is the place details search
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again
            infowindow.marker = marker;
            var innerHTML = '<div id="info-content">';
            if (place.name) {
                innerHTML += '<strong id="placeName" data-bind="text: placeName"></strong>';
                innerHTML += '<span class="hidden" id="placeId" data-bind="text: placeId"></span>';
                innerHTML += '<br><strong><a href="#"  id="addFav" data-bind="click: addFavorite">Add to Favorites</a></strong>';
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.opening_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>' +
                    place.opening_hours.weekday_text[0] + '<br>' +
                    place.opening_hours.weekday_text[1] + '<br>' +
                    place.opening_hours.weekday_text[2] + '<br>' +
                    place.opening_hours.weekday_text[3] + '<br>' +
                    place.opening_hours.weekday_text[4] + '<br>' +
                    place.opening_hours.weekday_text[5] + '<br>' +
                    place.opening_hours.weekday_text[6];
            }
            if (place.photos) {
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                    {maxHeight: 100, maxWidth: 200}) + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Apply infowindow ViewModel bindings
            ko.applyBindings(windowViewModel, document.getElementById('info-content'));
            windowViewModel.placeName(place.name);
            windowViewModel.placeId(place.place_id);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    });
}

// This function will loop through the markers array and display them all
function showMarkers() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through a markers array and hide them all
function hideMarkers(markers, forteams) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    // Empty placeMarkers array to avoid looping through markers that are not used anymore
    // when hiding places markers the next time. Skip when hiding team markers
    if (forteams != 1) {
        placeMarkers = [];
    }
}

// This function will display marker for a specific team only
function putMarker(id) {
    hideMarkers(markers, 1);
    markers[id].setMap(map);
    map.setCenter(markers[id].position);
    map.setZoom(16);
}

// This function searches for specific types of places(bars or parking) and creates markers
function searchForPlaces(place, latlng) {
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: place,
        location: latlng,
        radius: 1000
    }, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            if (place == 'bars') {
                createMarkersForPlaces(results, 1);
            } else {
                createMarkersForPlaces(results, 2);
            }
        }
    });
}

// This function searches for a place using place id and displays marker and infowindow
function searchForAPlace(placeId) {
    hideMarkers(placeMarkers);
    var request = {
        placeId: placeId,
    };
      
    var service = new google.maps.places.PlacesService(map);
    service.getDetails(request, callback);
      
    function callback(place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            var placesarray = [];
            placesarray.push({'name': place.name, 'place_id': place.place_id, 'icon': place.icon, 'geometry': place.geometry})
            createMarkersForPlaces(placesarray);
            getPlacesDetails(placeMarkers[0], placeInfoWindow);
        }
    }
}

// This function gets news about a team
function getNews(team) {
    var oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    var teamName = '+Chicago+' + team;
    var url = 'https://newsapi.org/v2/everything?' +
          'q=' + teamName + '&' +
          'sources=abc-news,associated-press,bbc-sport,espn,fox-sports,nfl-news,reuters,nhl-news,nbc-news,bleacher-report&' +
          'from=' + oneWeekAgo.toISOString() + '&' +
          'apiKey=34bb0e16036c499ca6eec0bcfca34cf1';
    var req = new Request(url);
    fetch(req)
        .then(response => 
            response.json().then(data => ({
                data: data,
                status: response.status
            })).then(res => {
                var html = '<div><h4>Latest ' + team + ' news:</h4>';
                if (res.status == 200) {
                    var articles = res.data.articles;
                    if (articles.length == 0) {
                        html +='<span>No articles available.</span>';
                    } else {
                        html += '<ul>';
                        var lasttitle = '';
                        for(a in articles) {
                            var title = articles[a].title;
                            if (title != lasttitle) {
                                html += '<li><a href="' + articles[a].url + '" target="_blank">' + title + '</a></li>';
                                lasttitle = title;
                            }
                        }
                        html += '<li>Powered by: <a href="https://newsapi.org" target="_blank">NewsAPI</a></li></ul>';
                    }
                } else {
                    html += '<span>News articles could not be loaded!</span>';
                }
                html += '</div>';
                viewModel.showArticles(html);
            })
        ).catch(function(error) {
            console.log(error);
        });
}

// ViewModel for the infowindows
function windowViewModel() {
    var self = this;
    self.placeName = ko.observable();
    self.placeId = ko.observable();

    self.addFavorite = function() {
        viewModel.addToFavorites(self.placeId(), self.placeName());
    }
}

// The main ViewModel
function TeamsViewModel() {
    // Data
    var self = this;
    self.teams = [];
    for(var t in teamsJson) self.teams.push(t);
    self.chosenTeam = ko.observable();
    self.bg_color = ko.observable();
    self.teamLogo = ko.observable();
    self.showSearch = ko.observable(false);
    self.searchInput = ko.observable();
    self.showNews = ko.observable(false);
    self.newsArticles = ko.observable();
    // Favorite places array
    self.favorites = ko.observableArray();
    if (localStorage.getItem('favorites') != null) {
        self.favorites(JSON.parse(localStorage.getItem('favorites')));
    }
    self.showClearButton = ko.observable(false);
    self.bars = ko.observableArray();
    self.parking = ko.observableArray();
    

    // Behaviours
    self.goToTeam = function(team) { 
        self.chosenTeam(team);
        self.bg_color('#' + teamsJson[team].color);
        self.teamLogo(teamsJson[team].logo);
        self.showSearch(true);
        putMarker(teamsJson[team].id);
        getNews(team);
        self.clearAll();
        self.bars([]);
        self.parking([]);
        self.showBars(teamsJson[team].venueLocation);
        self.showParking(teamsJson[team].venueLocation);
        self.showClearButton(true);
    };
    self.showAll = function() {
        showMarkers();
        self.clearAll();
        self.showClearButton(false);
        self.showSearch(false);
        self.bg_color('#9795A3');
        self.chosenTeam('');
        self.teamLogo('');
        self.showNews(false);
    };
    self.clearAll = function() {
        self.searchInput(null);
        hideMarkers(placeMarkers);
        self.showClearButton(false);
    }
    self.showBars = function(latlng) {
        searchForPlaces('bars', latlng);
    }
    self.showParking = function(latlng) {
        searchForPlaces('parking', latlng);
    }
    self.showArticles = function(html) {
        self.newsArticles(html);
    }
    self.toggleNews = function() {
        if (self.showNews()) {
            self.showNews(false);
        } else {
            self.showNews(true);
        }
    }
    self.goPlaces = function() {
        textSearchPlaces(self.searchInput());
    }
    self.addToFavorites = function(placeId, placeName) {
        var newFavorite = {id: placeId, name: placeName};
        var flag = 0;
        for (var i = 0; i < self.favorites().length; i++) {
            if (self.favorites()[i]['id'] == placeId) {
                flag++;
                window.alert('\'' + placeName + '\' is already in your Favorites!');
                break;
            }
        }
        if (flag == 0) {
            self.favorites.push(newFavorite);
            localStorage.setItem('favorites', JSON.stringify(self.favorites()));
            window.alert('\'' + placeName + '\' was added to your Favorites!');
        }
    }
    self.goToFavorite = function(place) {
        searchForAPlace(place.id);
        self.showClearButton(true);
    }
    self.removeFavorite = function(place) {
        self.favorites.remove(function(item) {
            return item.id == place.id;
        });
        localStorage.setItem('favorites', JSON.stringify(self.favorites()));
    }
    self.goToPlace = function(marker) {
        self.clearAll();
        placeMarkers.push(marker);
        marker.setMap(map);
        getPlacesDetails(marker, placeInfoWindow);
        var that = marker;
        marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                that.setAnimation(null);
            }, 700);
        self.showClearButton(true);
    }
};

var windowViewModel = new windowViewModel();
var viewModel = new TeamsViewModel();
ko.applyBindings(viewModel);