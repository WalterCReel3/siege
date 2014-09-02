var Scene = klass.create();
_.extend(Scene.prototype, {
    initialize: function(app, canvas) {
        this.application = app;
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.graphics = canvas.getContext('2d');
        this.objects = [];
    },

    render: function() {
        var g = this.graphics;
        g.clearRect(0, 0, this.width, this.height);
        _.each(this.objects, function(object) {
            g.save();
            object.render(g);
            g.restore();
        });
    },

    addObject: function(obj) {
        this.objects.push(obj);
    }
});

var Clan = klass.create();
_.extend(Clan.prototype, {
    initialize: function(id) {
        this.id = id;
        this.points = 0;
        this.lastTime = 0;
    },

    tick: function() {
        this.points -= Math.ceil(this.points * 0.01);
        if (this.points < 20) {
            this.points = 0;
        }
    }
});

var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        this.canvas = $('#canvas');
        this.totalScore = $("#total-score");
        this.namespace = '/game';
        this.socket = io.connect(
                '//' + document.domain +
                ':'  + location.port + this.namespace);
        this.scene = new Scene(this, this.canvas.get(0));
        this.tasklet = new Tasklet(_.bind(this.onEnterFrame, this), 20);

        this.bindEvents();

        var chartPos = [this.scene.width/2, this.scene.height/2];
        this.chart = new PiChart(this, chartPos, 100, 3);
        this.scene.addObject(this.chart);

        this.clans = [];
        this.nclans = 3;

        for (var i=0; i<3; i++) {
            this.clans.push(new Clan(i));
        }

        this.totalPoints = 0;
    },

    bindEvents: function() {
        this.socket.on('game-update', _.bind(this.onGameEvent, this));
        this.canvas.on('click', _.bind(this.onCanvasClick, this));
        $(window).on('beforeunload', _.bind(this.onDestroy, this));
    },

    onDestroy: function() {
        this.socket.disconnect()
    },

    run: function() {
        this.tasklet.run();
    },

    onGameEvent: function(msg) {
        var clans = msg[0].clans;
        console.log(clans)
        for (var i=0;i<clans.length;i++) {
            this.clans[i].points = clans[i];
        }
    },

    clanAttack: function() {
        this.socket.emit('click-event', {});
    },

    calcControl: function() {
        this.totalPoints = _.reduce(this.clans, function(acc, clan) {
            return clan.points + acc;
        }, 0);
        var eval = this.totalPoints;
        if (this.totalPoints < 2000) {
            eval = 2000;
        }
        var self = this;
        var ret = _.map(this.clans, function (clan) {
            if (self.totalPoints === 0) {
                return 0;
            }
            return clan.points / eval;
        });
        return ret;
    },

    renderStats: function() {
        this.totalScore.text(this.totalPoints);
    },

    tick: function() {
        // Evaluated by the server
        // stimulate the natural decay before
        // the next update from the server
        _.each(this.clans, function(clan) {
            clan.tick();
        });
        this.chart.updateWedges(this.calcControl());
    },

    onEnterFrame: function() {
        this.tick()
        this.renderStats();
        this.scene.render();
    },

    onCanvasClick: function(evt) {
        // var scenePos = this.translateScenePosition(evt);
        // this.newActor(scenePos);
        this.clanAttack(0, 100);
    }
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
