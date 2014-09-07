var points = [
    [35.858074,-78.898278], // 0 nw
    [35.858118,-78.895671], // 1 ne
    [35.856848,-78.898321], // 2 owltown w
    [35.856961,-78.8958],   // 3 owltown e
    [35.855761,-78.898664], // 4 talking rock w
    [35.855683,-78.896819], // 5 river bottom e
    [35.856178,-78.896036], // 6 pickett brach ee
    [35.854526,-78.898847], // 7 sw
    [35.854361,-78.895993], // 8 se
];

var bexly = [
  [0, 2, 3, 1],
  [2, 4, 5, 6, 3],
  [4, 7, 8, 5]
];

var bexlyRegions = [
  'North',
  'Middle',
  'South'
];

var pointInPolygon = function (point, poly) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    // unpack the point coords
    var x = point[0];
    var y = point[1];

    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        // get the line segment coords
        var x1 = points[poly[i]][0];
        var y1 = points[poly[i]][1];
        var x2 = points[poly[j]][0];
        var y2 = points[poly[j]][1];
        // ???
        var intersect = ((y1 > y) != (y2 > y))
                         && (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1);
        // profit!
        if (intersect) {
            // even/odd rule
            inside = !inside;
        }
    }

    return inside;
};

var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        this.messageElement = $('#message');
        this.tasklet = new Tasklet(_.bind(this.fetchLocation, this), 5000);
        this.bindEvents();
        this.fetchLocation();
    },

    bindEvents: function() {
    },

    onDestroy: function() {
    },

    fetchLocation: function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                    _.bind(this.getCurrentPosition, this),
                    _.bind(this.fail, this),
                    {enableHighAccuracy: true,
                     maximumAge: 20000,
                     timeout: 10000});
        } else {
            this.messageElement.val('No location info');
        }
    },

    findRegion: function(position) {
        var point = [position.coords.latitude, position.coords.longitude];
        for (var i=0; i<bexly.length; i++) {
            if(pointInPolygon(point, bexly[i])) {
                return i;
            }
        }
        return -1;
    },

    getCurrentPosition: function(position) {
        // entry.text(msg);
        var region = this.findRegion(position);
        if (region != -1) {
            var entry = $(document.createElement('p'));
            var msg = bexlyRegions[region];
            entry.text(msg);
            this.messageElement.append(entry);
        }
        var debug = "Latitude: " + position.coords.latitude +
                    " Longitude: " + position.coords.longitude +
                    " Accuracy: " + position.coords.accuracy;
        console.log(debug);
    },

    fail: function() {
        var entry = $(document.createElement('p'));
        var msg = "location failure";
        entry.text(msg);
        this.messageElement.append(entry);
        console.log(msg);
        // try again
        // this.fetchLocation();
    },

    run: function() {
        this.tasklet.run();
    }
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
