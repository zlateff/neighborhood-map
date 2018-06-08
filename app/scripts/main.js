var map;
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.7413549, lng: -73.9980244},
      zoom: 13,
      mapTypeControl: false
    });
}

// Here's my data model
var ViewModel = function(first, last) {
    this.firstName = ko.observable(first);
    this.lastName = ko.observable(last);
 
    this.fullName = ko.pureComputed(function() {
        // Knockout tracks dependencies automatically. It knows that fullName depends on firstName and lastName, because these get called when evaluating fullName.
        return this.firstName() + " " + this.lastName();
    }, this);
};
 
ko.applyBindings(new ViewModel("Planet", "Earth")); // This makes Knockout get to work