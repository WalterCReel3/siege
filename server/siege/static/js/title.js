var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        // this.tasklet = new Tasklet(_.bind(this.onEnterFrame, this), 20);
        this.bindEvents();
    },

    bindEvents: function() {
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
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
