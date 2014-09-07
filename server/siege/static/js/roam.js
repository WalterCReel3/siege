var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        this.messageElement = $('#message');
        // this.tasklet = new Tasklet(_.bind(this.fetchLocation, this), 1000);
        this.bindEvents();
        this.fetchLocation();
    },

    bindEvents: function() {
    },

    onDestroy: function() {
    },

    fetchLocation: function() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                    _.bind(this.getCurrentPosition, this),
                    _.bind(this.fail, this),
                    {enableHighAccuracy: true,
                     maximumAge: 600000,
                     timeout: 0});
        } else {
            this.messageElement.val('No location info');
        }
    },

    getCurrentPosition: function(position) {
        var entry = $(document.createElement('p'));
        var msg = "Latitude: " + position.coords.latitude +
                  " Longitude: " + position.coords.longitude +
                  " Accuracy: " + position.coords.accuracy;
        entry.text(msg);
        this.messageElement.append(entry);
        console.log(msg);
    },

    fail: function() {
        var entry = $(document.createElement('p'));
        var msg = "location failure";
        entry.text(msg);
        this.messageElement.append(entry);
        console.log(msg);
        // try again
        this.fetchLocation();
    },

    run: function() {
        // May want to run a current game inspection
        // this.tasklet.run();
    },

    renderStats: function() {
        // this.clan0Score.text(this.clans[0].points);
    },
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
