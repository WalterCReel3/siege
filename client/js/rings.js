var rgbaString = function(color) {
    var alpha = color[3] || 1.0;
    return "rgba(" + Math.round(color[0]) + ", "
                   + Math.round(color[1]) + ", "
                   + Math.round(color[2]) + ", "
                   + alpha + ")";
}

var randcolor = function() {
    return [Math.random()*255,
            Math.random()*255,
            Math.random()*255];
}

var randbound = function(min, max) {
    var range = max - min;
    return (Math.random() * range) + min;
}

// May want to track things using polar coords
// and then translating to x,y
var PiChart = klass.create();
_.extend(PiChart.prototype, {
    initialize: function(pos, rad) {
        this.position = pos;
        this.radius = rad;

        this.rad_begin = 0;
        this.rad_end = Math.PI / 2;

        this.factions = [0.25, 0.43, 0.10];
        this.fcolors = [randcolor(), randcolor(), randcolor()];

        this.rings = 10;
        this.ringState = [];
        this.maxVarience = Math.PI / 3

        for (var i=0; i<this.rings; i++) {
            this.ringState.push(randbound(-0.3, 0.3));
        }
    },

    tick: function() {
        for (var i=0; i<this.rings; i++) {
            var newVarience = this.ringState[i] + randbound(-0.01, 0.01);
            if (newVarience > this.maxVarience) {
                newVarience = this.maxVarience;
            } else if (newVarience < -this.maxVarience) {
                newVarience = -this.maxVarience;
            }
            this.ringState[i] = newVarience;
        }
    },

    renderFactionFraction: function(g, r1, r2, rgba) {
        var ring_width = (this.radius / (this.rings * 2));
        for (var i = 0; i < this.rings - 2; i++) {
            var ring_height = this.radius - (i * ring_width * 2);
            g.beginPath();
            g.fillStyle = rgba;
            g.arc(this.position[0], this.position[1], ring_height,
                  r1 + this.ringState[i], r2 + this.ringState[i]);
            g.arc(this.position[0], this.position[1], ring_height - ring_width,
                  r2 + this.ringState[i], r1 + this.ringState[i], true);
            g.fill();
            g.closePath();
        }
    },

    render: function(g) {
        this.tick();

        var last = 0;
        var unclaimed = 1 - _.reduce(this.factions, function (l, r) {
            return l + r;
        }, 0);
        var buffer = (unclaimed * Math.PI * 2) / this.factions.length;
        for (var i=0; i<this.factions.length; i++) {
            var arc = this.factions[i] * Math.PI * 2 + last;
            this.renderFactionFraction(
                    g, last, arc, rgbaString(this.fcolors[i]));
            last = arc + buffer;
        }
    }
});

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
        var scenePos = this.translateScenePosition(evt);
        this.newActor(scenePos);
    }
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
