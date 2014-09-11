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
        [35.858074,-78.898278], // 0 nw
        [35.858118,-78.895671], // 1 ne
        [35.856848,-78.898321], // 2 owltown w
        [35.856961,-78.8958],   // 3 owltown e
        [35.855761,-78.898664], // 4 talking rock w
        [35.855683,-78.896819], // 5 river bottom e
        [35.856178,-78.896036], // 6 pickett brach ee
        [35.854526,-78.898847], // 7 sw
        [35.854361,-78.895993], // 8 se
    ],
    regions: [
        { name: 'North', indexes: [0, 2, 3, 1] },
        { name: 'Middle', indexes: [2, 4, 5, 6, 3] },
        { name: 'South', indexes: [4, 7, 8, 5] },
    ]
};

var GeoTracking = klass.create();
_.extend(GeoTracking.prototype, {
    initialize: function(application, locationData) {
        this.application = application;
        this.locationData = locationData;
        this.enabled = false;
        this.currentRegion = -1;
        if (navigator.geolocation) {
            this.tasklet = new Tasklet(_.bind(this.fetchLocation, this), 5000);
        } else {
            this.currentRegion = 0;
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

    getCurrentPosition: function(position) {
        var regionId = this.findRegion(position);
        if ((regionId != -1) && (regionId != this.currentRegion)) {
            this.currentRegion = regionId;
            var region = this.locationData.regions[regionId];
            console.log(region.name);
            this.application.updateTerritory(region.name, regionId);
        }
        // var debug = "Latitude: " + position.coords.latitude +
        //             " Longitude: " + position.coords.longitude +
        //             " Accuracy: " + position.coords.accuracy;
        // console.log(debug);
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
        var clans = msg[0].clans;
        for (var i=0;i<clans.length;i++) {
            this.clans[i].points = clans[i];
        }
    },

    clanAttack: _.debounce(function() {
        this.socket.emit('click-event', {});
    }, 50, true),

    updateTerritory: function(name, id) {
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
