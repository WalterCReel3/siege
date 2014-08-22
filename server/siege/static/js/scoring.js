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
        this.points -= Math.ceil(this.points * 0.008);
    }
});

var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        this.element = $('#application');
        this.canvas = $('#canvas');
        this.clan0Score = $("#clan-0-score");
        this.clan1Score = $("#clan-1-score");
        this.clan2Score = $("#clan-2-score");
        this.totalScore = $("#total-score");
        this.socket = io.connect(
                '//' + document.domain +
                ':'  + location.port + '/test');
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
        $(window).on('keypress', _.bind(this.onKeyPress, this));
        $(window).on('beforeunload', _.bind(this.onDestroy, this));
    },

    onDestroy: function() {
        this.socket.disconnect()
    },

    run: function() {
        this.tasklet.run();
    },

    onGameEvent: function(msg) {
        var id = msg.id;
        var power = msg.power;
        var clan = this.clans[id];
        clan.points += power;
    },

    factionAttack: function(id, power) {
        this.socket.emit('click-event', {'id': id, 'power':power});
    },

    onKeyPress: function(evt) {
        var key = String.fromCharCode(evt.charCode);
        switch (key) {
        case 'q':
            this.factionAttack(0, 100);
            break;
        case 'r':
            this.factionAttack(1, 100);
            break;
        case 'u':
            this.factionAttack(2, 100);
            break;
        }
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
        this.clan0Score.text(this.clans[0].points);
        this.clan1Score.text(this.clans[1].points);
        this.clan2Score.text(this.clans[2].points);
        this.totalScore.text(this.totalPoints);
    },

    tick: function() {
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
        this.factionAttack(0, 100);
    }
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
