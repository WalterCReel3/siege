var Application = function() {
    this.element = $('#application');
    this.clicker = $('#clicker');
    this.bindEvents();
}

_.extend(Application.prototype, {
    bindEvents: function() {
        this.clicker.on('click', function(e) {
            alert(e);
        });
    }
});


$(document).ready(function () {
    window.application = new Application();
});
// vim: set sts=4 sw=4 expandtab:
