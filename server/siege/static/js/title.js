var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        this.messageElement = $("#message");
        // this.tasklet = new Tasklet(_.bind(this.onEnterFrame, this), 20);
        this.bindEvents();
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                    _.bind(this.getCurrentPosition, this));
        } else {
            this.messageElement.text('No location info');
        }
    },

    bindEvents: function() {
    },

    getCurrentPosition: function(position) {
        var msg = "Latitude: " + position.coords.latitude + 
                  " Longitude: " + position.coords.longitude
        console.log(msg);
        this.messageElement.text(msg);
    },

    onDestroy: function() {
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
    console.log('here');
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
