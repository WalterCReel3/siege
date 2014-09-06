var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        this.messageElement = $("#message");
        this.nameInput = $("#name");
        this.refreshButton = $("#fetch");
        // this.tasklet = new Tasklet(_.bind(this.onEnterFrame, this), 20);
        this.bindEvents();
    },

    fetchLocation: function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                    _.bind(this.getCurrentPosition, this));
        } else {
            this.messageElement.val('No location info');
        }
    },

    bindEvents: function() {
        this.refreshButton.on('click', _.bind(this.fetchLocation, this));
    },

    getCurrentPosition: function(position) {
        var msg = this.nameInput.val() + 
                  " (" + position.coords.latitude + 
                  ") (" + position.coords.longitude + ")\n"
        console.log(msg);
        var cur = this.messageElement.val();
        this.messageElement.val(cur + msg);
    }
});

$(document).ready(function () {
    console.log('here');
    window.application = new Application();
});
// vim: set sts=4 sw=4 expandtab:
