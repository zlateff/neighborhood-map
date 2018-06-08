var teamsJson = {
    "Bears" : {
        lat: 0,
        lng: 0,
        color: "",
        logo: "",
    },
    "Blackhawks" : {
        lat: 0,
        lng: 0,
        color: "",
        logo: "",
    },
    "Bulls" : {
        lat: 0,
        lng: 0,
        color: "",
        logo: "",
    },
    "Cubs" : {
        lat: 0,
        lng: 0,
        color: "",
        logo: "",
    },
    "White Sox" : {
        lat: 0,
        lng: 0,
        color: "",
        logo: "",
    },
}

var map;
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 41.880748, lng: -87.674265},
      zoom: 12,
      mapTypeControl: false
    });
}


function TeamsViewModel() {
    // Data
    var self = this;
    self.teams = [];
    for(var t in teamsJson) self.teams.push(t);
    self.chosenTeam = ko.observable();
    self.chosenTeamData = ko.observable();

    // Behaviours
    self.goToTeam = function(team) { 
        self.chosenTeam(team);
        // CHANGE THIS $.get('', { team: team }, self.chosenFolderData); 
    };
};

ko.applyBindings(new TeamsViewModel());