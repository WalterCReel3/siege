var Scene = klass.create();
_.extend(Scene.prototype, {
    initialize: function(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.graphics = canvas.getContext('2d');
        this.chart = new PiChart([this.width/2, this.height/2], 100);
    },

    render: function() {
        var g = this.graphics;
        g.clearRect(0, 0, this.width, this.height);
        g.save();
        this.chart.render(g);
        g.restore();
    }
});

var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        this.canvas = $('#canvas');
        this.scene = new Scene(this.canvas.get(0));
        this.tasklet = new Tasklet(_.bind(this.onEnterFrame, this), 20);
        this.bindEvents();
    },

    bindEvents: function() {
        this.canvas.on('click', _.bind(this.onCanvasClick, this));
        $(window).on('keypress', _.bind(this.onKeyPress, this));
    },

    run: function() {
        this.tasklet.run();
    },

    onKeyPress: function() {
    },

    onEnterFrame: function() {
        this.scene.render();
    },

    onCanvasClick: function(evt) {
        // var scenePos = this.translateScenePosition(evt);
        // this.newActor(scenePos);
    }
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
