var rgbaString = function(color) {
    var alpha = color[3] || 1.0;
    return "rgba(" + Math.round(color[0]) + ", "
                   + Math.round(color[1]) + ", "
                   + Math.round(color[2]) + ", "
                   + alpha + ")";
}

function randcolor() {
    return [Math.random()*255,
            Math.random()*255,
            Math.random()*255];
}

var Actor = klass.create();
_.extend(Actor.prototype, {
    initialize: function(scene, position, faction) {
        this.scene = scene;
        this.position = position;
        this.faction = faction;
        this.color = randcolor();
    },

    tick: function() {
    },

    render: function(g) {
        g.beginPath();
        g.fillStyle = rgbaString(this.color);
        g.arc(this.position[0], this.position[1], 10,
              0, Math.PI*2, 0);
        g.fill()
        g.closePath();
    }
});

var Scene = klass.create();
_.extend(Scene.prototype, {
    initialize: function(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.graphics = canvas.getContext('2d');
        this.actors = [];
    },
    addActor: function(actor) {
        this.actors.push(actor);
    },

    render: function() {
        var g = this.graphics;
        g.clearRect(0, 0, this.width, this.height);
        _.each(this.actors, function (actor) {
            try {
                g.save();
                actor.render(g);
                g.restore();
            } catch (e) {
                console.log(e);
            }
        });
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
    },

    translateScenePosition: function(evt) {
        var scrollX = window.scrollX != null
                        ? window.scrollX
                        : window.pageXOffset;
        var scrollY = window.scrollY != null
                        ? window.scrollY
                        : window.pageYOffset;
        var canvasOffset = this.canvas.offset();
        var mouseX = evt.clientX - canvasOffset.left + scrollX;
        var mouseY = evt.clientY - canvasOffset.top + scrollY;
        return [mouseX, mouseY];
    },

    run: function() {
        this.tasklet.run();
    },

    newActor: function(position) {
        var actor = new Actor(this.scene, position, [0, 0, 0]);
        this.scene.addActor(actor);
    },

    onEnterFrame: function() {
        this.scene.render();
    },

    onCanvasClick: function(evt) {
        var scenePos = this.translateScenePosition(evt);
        this.newActor(scenePos);
    }
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
