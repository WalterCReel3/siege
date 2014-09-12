var LogoUrls = [
'/static/images/racoons-logo.png',
'/static/images/squirrels-logo.png',
'/static/images/chimps-logo.png',
];

var Logos = [];

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

var TeamLogo = klass.create();
_.extend(TeamLogo.prototype, {
    initialize: function(app) {
        this.application = app;
    },

    render: function(g) {
        var image = Logos[0];
        var clan = this.application.player.clan;
        var x = this.application.scene.width - image.width;
        var y = 5;
        g.drawImage(Logos[clan], x, 5);
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

var LocationData = {
    coordinates: [
        [35.775777,-78.640504],
        [35.775719,-78.639387],
        [35.774755,-78.638283],
        [35.774829,-78.640552],

        [35.775703,-78.639222],
        [35.77569,-78.638165],
        [35.774767,-78.63939],
        [35.774755,-78.638283],

        [35.774826,-78.640544],
        [35.774767,-78.63939],
        [35.774158,-78.639485],
        [35.774198,-78.640565],

        [35.774767,-78.63939],
        [35.774755,-78.638283],
        [35.77415,-78.639319],
        [35.774119,-78.638278]
    ],
    regions: [
        {
            name: 'Sir Waltersberg',
            indexes: [0, 1, 2, 3]
        }, {
            name: 'East Faye',
            indexes: [4, 5, 6, 7]
        }, {
            name: 'Sheratonia',
            indexes: [8, 9, 10, 11]
        }, {
            name: 'Plazastan',
            indexes: [12, 13, 14, 15]
        }
    ]
};

var GeoTracking = klass.create();
_.extend(GeoTracking.prototype, {
    initialize: function(application, locationData) {
        this.application = application;
        this.locationData = locationData;
        this.enabled = false;
        this.currentRegion = 0;
        this.setRegion(0);
        if (navigator.geolocation) {
            this.tasklet = new Tasklet(_.bind(this.fetchLocation, this), 5000);
        }
    },

    pointInPolygon: function(point, poly) {
        var points = this.locationData.coordinates;
        // unpack the point coords
        var x = point[0];
        var y = point[1];

        var inside = false;
        for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            // get the line segment coords
            var x1 = points[poly[i]][0];
            var y1 = points[poly[i]][1];
            var x2 = points[poly[j]][0];
            var y2 = points[poly[j]][1];
            var intersect = ((y1 > y) != (y2 > y))
                             && (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1);
            if (intersect) {
                // even/odd rule
                inside = !inside;
            }
        }

        return inside;
    },

    fetchLocation: function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                    _.bind(this.getCurrentPosition, this),
                    _.bind(this.fail, this),
                    {enableHighAccuracy: true,
                     maximumAge: 20000,
                     timeout: 10000});
        }
    },

    findRegion: function(position) {
        var point = [position.coords.latitude, position.coords.longitude];
        var regions = this.locationData.regions;
        for (var i=0; i<regions.length; i++) {
            if (this.pointInPolygon(point, regions[i].indexes)) {
                return i;
            }
        }
        return -1;
    },

    setRegion: function(id) {
        this.currentRegion = id;
        var region = this.locationData.regions[id];
        this.application.updateTerritory(region.name, id);
        console.log(region.name);
    },

    getCurrentPosition: function(position) {
        var regionId = this.findRegion(position);
        if ((regionId != -1) && (regionId != this.currentRegion)) {
            this.setRegion(regionId);
        }
    },

    fail: function() {
        var msg = "location failure";
        console.log(msg);
    },

    run: function() {
        this.tasklet.run();
    }
});

var Application = klass.create();
_.extend(Application.prototype, {
    initialize: function() {
        // DOM handles and setup
        this.element = $('#application');
        this.canvas = $('#canvas');
        this.totalScore = $('#total-score');
        this.tapButton = $('#tap-button');
        this.territoryName = $('#territory-name');
        this.adjustCanvas();

        // Event streaming
        this.namespace = '/game';
        this.socket = io.connect(this.socketConnectionString());

        // Graphics and gameloop
        this.scene = new Scene(this, this.canvas.get(0));
        this.tasklet = new Tasklet(_.bind(this.onEnterFrame, this), 20);

        // UI event management
        this.bindEvents();

        // UI element setup
        var chartPos = [this.scene.width/2, this.scene.height/2];
        this.chart = new PiChart(this, chartPos, 100, 3);
        this.teamLogo = new TeamLogo(this);
        this.scene.addObject(this.chart);
        this.scene.addObject(this.teamLogo);

        // GeoTracking
        this.geoTracking = new GeoTracking(this, LocationData);
        this.territory = 0;

        // Client side game state management
        this.game = null;
        this.device = null;
        this.player = null;
        this.clans = [];
        this.nclans = 3;
        for (var i=0; i<3; i++) {
            this.clans.push(new Clan(i));
        }

        this.loadAssets();
        this.totalPoints = 0;
    },

    socketConnectionString: function () {
        return '//' + document.domain + ':'  + location.port + this.namespace;
    },

    adjustCanvas: function (canvas) {
        this.canvas.attr('width', window.innerWidth);
        this.canvas.attr('height', window.innerHeight - 2);
    },

    bindEvents: function() {
        this.socket.on('game-update', _.bind(this.onGameEvent, this));
        this.tapButton.on('mousedown', _.bind(this.onCanvasClick, this));
        $(window).on('touchstart', _.bind(this.onCanvasClick, this));
        $(window).on('beforeunload', _.bind(this.onDestroy, this));
    },

    loadAssets: function() {
        // Load Images
        for (var i=0; i<3; i++) {
            var image = new Image();
            image.src = LogoUrls[i];
            Logos.push(image);
        }
    },

    onDestroy: function() {
        this.socket.disconnect()
    },

    run: function() {
        this.geoTracking.run();
        var self = this;
        $.ajax({url:'/game/info'}).then(function(resp) {
            self.game = resp.game;
            self.device = resp.device;
            self.player = resp.player;
            self.tasklet.run();
        }).fail(function(error) {
            console.log(error);
        });
    },

    onGameEvent: function(msg) {
        console.log(msg.gameMode);
        var clans = msg[this.territory].clans;
        for (var i=0;i<clans.length;i++) {
            this.clans[i].points = clans[i];
        }
    },

    clanAttack: _.debounce(function() {
        this.socket.emit('click-event', {territory: this.territory});
    }, 50, true),

    updateTerritory: function(name, id) {
        this.territory = id;
        this.territoryName.text(name);
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
