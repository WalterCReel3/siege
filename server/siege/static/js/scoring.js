var GM_IN_GAME = 'in-game';
var GM_ENDED = 'ended';

var ImageAssets = [
    ['racoons-logo', '/static/images/racoons-logo.png'],
    ['squirrels-logo', '/static/images/squirrels-logo.png'],
    ['chimps-logo', '/static/images/chimps-logo.png'],
    ['racoons-logo-large', '/static/images/racoons-logo-large.png'],
    ['squirrels-logo-large', '/static/images/squirrels-logo-large.png'],
    ['chimps-logo-large', '/static/images/chimps-logo-large.png'],
    ['winner-logo-large', '/static/images/winner-logo.png'],
];

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
        if (!obj) return;
        this.objects.push(obj);
    },

    removeObject: function(remove) {
        this.objects = _.without(this.objects, remove);
    },

    reset: function() {
        this.objects = [];
    }
});

var TeamLogo = klass.create();
_.extend(TeamLogo.prototype, {
    initialize: function(app) {
        this.application = app;
    },

    render: function(g) {
        var clan = this.application.player.clan;
        var image = this.application.clanLogos[clan];
        var x = this.application.scene.width - image.width;
        var y = 5;
        g.drawImage(image, x, 5);
    }
});

var WinnerLogo = klass.create();
_.extend(WinnerLogo.prototype, {
    initialize: function(app, clanId) {
        this.application = app;
        this.clanId = clanId;
        this.clanImage = this.application.clanLogosLarge[clanId];
        this.winnerImage = this.application.assets.images['winner-logo-large'];

        this.bounceY = 0;
        this.bounceYRad = 0;
        this.bounceX = 0;
        this.bounceXRad = 0;
    },

    tick: function() {
        this.bounceYRad += 0.17;
        this.bounceY = Math.cos(this.bounceYRad) * 6;
        this.bounceXRad += 0.09;
        this.bounceX = Math.cos(this.bounceXRad) * 3;
    },

    render: function(g) {
        var scene = this.application.scene;
        var centerX = (scene.width / 2);
        var centerY = (scene.height / 2);
        var clanX = centerX - (this.clanImage.width / 2);
        var clanY = centerY - (this.clanImage.height / 2);
        var winCenterX = this.winnerImage.width / 2;
        var winCenterY = this.winnerImage.height / 2;
        g.drawImage(this.clanImage, clanX, clanY);
        g.translate(centerX + this.bounceX,
                    centerY - (clanY / 2) + this.bounceY);
        // g.translate(this.winnerImage.width / 2,
        //             this.winnerImage.height / 2);
        // g.rotate(this.bounceY / 30);
        g.drawImage(this.winnerImage,
                    -this.winnerImage.width / 2,
                    (-this.winnerImage.height / 2));

        // g.drawImage(this.winnerImage, x, y - 40 + this.bounceY);
    }
});

var NewGameCountdown = klass.create();
_.extend(NewGameCountdown.prototype, {
    initialize: function(app) {
        this.application = app;
        this.countdown = 0;
    },

    update: function(c) {
        this.countdown = c;
    },

    render: function(g) {
        var scene = this.application.scene;
        var centerX = (scene.width / 2);
        var centerY = (scene.height / 2);
        g.font = '20pt sans-serif';
        g.textAlign = 'center';
        g.fillStyle = 'black';
        g.fillText('New game in', centerX, centerY - 10);
        g.font = '30pt sans-serif';
        g.fillText('' + this.countdown, centerX, centerY + 30);
    }
});

var TerritoriesDisplay = klass.create();
_.extend(TerritoriesDisplay.prototype, {
    initialize: function(app) {
        this.application = app;
        this.margin = 18;
        this.padding = 3;
        this.rectWidth = 30;
        this.rectHeight = 50;
        this.territoryControl = null;
        this.controlColors = [[255, 78, 78],
                              [78, 255, 78],
                              [78, 78, 255]];
    },

    update: function(territoryControl) {
        this.territoryControl = territoryControl;
    },

    renderTerritory: function(g, x1, y1, width, height, territory) {
        g.beginPath();
        g.rect(x1, y1, width, height);
        g.lineWidth = 2;
        if (territory.controllingClan != -1) {
            var clanId = territory.controllingClan;
            var color = rgbaString(this.controlColors[clanId]);
            g.fillStyle = color;
        } else {
            g.fillStyle = 'white';
        }
        g.strokeStyle = 'black';
        g.fill();
        g.stroke();
    },

    render: function(g) {
        if (!this.territoryControl) {
            return;
        }

        var scene = this.application.scene;
        var width = this.rectWidth;
        var height = this.rectHeight;

        var x1 = this.margin;
        var y1 = scene.height - this.margin - this.rectHeight;
        // 3
        this.renderTerritory(g, x1, y1, width, height,
                             this.territoryControl[2]);
        var x1 = this.margin + this.padding + width;
        // 4
        this.renderTerritory(g, x1, y1, width, height,
                             this.territoryControl[3]);
        // 1
        var x1 = this.margin;
        var y1 = scene.height - this.margin
                 - this.rectHeight * 2 - this.padding;
        this.renderTerritory(g, x1, y1, width, height,
                             this.territoryControl[0]);
        // 2
        var x1 = this.margin + this.padding + width;
        this.renderTerritory(g, x1, y1, width, height,
                             this.territoryControl[1]);
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
            name: '1: Sir Waltersberg',
            indexes: [0, 1, 2, 3]
        },
        {
            name: '2: East Faye',
            indexes: [4, 5, 6, 7]
        },
        {
            name: '3: Sheratonia',
            indexes: [8, 9, 10, 11]
        },
        {
            name: '4: Plazastan',
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
        this.application.updateTerritory(id);
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

        // Assets
        this.assets = {}

        // UI event management
        this.bindEvents();

        // UI element setup
        var chartPos = [this.scene.width/2, this.scene.height/2];
        this.chart = new PiChart(this, chartPos, 100, 3);
        this.teamLogo = new TeamLogo(this);
        this.newGameCountdown = new NewGameCountdown(this);
        this.territoriesDisplay = new TerritoriesDisplay(this);
        this.winnerLogo = null;
        this.clanLogos = [];
        this.clanLogosLarge = [];

        // Entity Management
        this.entities = [];
        this.addEntity(this.chart);

        // GeoTracking
        this.geoTracking = new GeoTracking(this, LocationData);
        this.territory = 0;

        // Client side game state management
        this.game = null;
        // Assume that we're waiting for a game
        // unless told so otherwise by the server
        this.gameMode = GM_ENDED;
        this.device = null;
        this.player = null;
        this.clans = [];
        this.nclans = 3;
        for (var i=0; i<3; i++) {
            var clanEntity = new Clan(i);
            this.clans.push(clanEntity);
            this.addEntity(clanEntity);
        }
        this.winScreenLocked = true;
        this.winScreenCountDown = 0;
        this.pending = true;

        this.loadAssets();
        this.totalPoints = 0;

        this.setPendingScene();
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
        this.assets.images = {};
        var self = this;
        _.each(ImageAssets, function(imageAsset) {
            var key = imageAsset[0];
            var src = imageAsset[1];
            var image = new Image();
            image.src = src;
            self.assets.images[key] = image;
        });
        this.clanLogos.push(this.assets.images['racoons-logo']);
        this.clanLogos.push(this.assets.images['squirrels-logo']);
        this.clanLogos.push(this.assets.images['chimps-logo']);
        this.clanLogosLarge.push(this.assets.images['racoons-logo-large']);
        this.clanLogosLarge.push(this.assets.images['squirrels-logo-large']);
        this.clanLogosLarge.push(this.assets.images['chimps-logo-large']);
    },

    onDestroy: function() {
        this.socket.disconnect()
    },

    run: function() {
        var self = this;
        $.ajax({url:'/game/info'}).then(function(resp) {
            self.game = resp.game;
            self.device = resp.device;
            self.player = resp.player;
            self.updateTerritory(self.player.currentTerritory);
            self.geoTracking.run();
            self.tasklet.run();
        }).fail(function(error) {
            console.log(error);
        });
    },

    setPendingScene: function() {
        this.scene.reset();
        this.scene.addObject(this.teamLogo);
        this.scene.addObject(this.newGameCountdown);
    },

    setInGameScene: function() {
        this.scene.reset();
        this.scene.addObject(this.teamLogo);
        this.scene.addObject(this.chart);
        this.scene.addObject(this.territoriesDisplay);
    },

    setEndScene: function() {
        this.scene.reset();
        this.scene.addObject(this.teamLogo);
        this.scene.addObject(this.winnerLogo);
    },

    onGameEnded: function(winner) {
        this.scene.removeObject(this.chart);
        this.socket.removeAllListeners('game-update');
        this.tapButton.text('New game');
        this.gameMode = GM_ENDED;
        this.tapButton.toggle();
        this.winScreenLockTimeout = (new Date()).getTime() + 5000;
        this.winScreenLocked = true;

        this.winnerLogo = new WinnerLogo(this, winner);
        this.setEndScene();
        this.addEntity(this.winnerLogo);
    },

    onGameStarted: function() {
        this.gameMode = GM_IN_GAME;
        this.setInGameScene();
    },

    onGameEvent: function(msg) {
        if ((this.gameMode !== msg.gameMode)
                && (msg.gameMode === GM_ENDED)) {
            console.log('Ending game');
            this.onGameEnded(msg.winner);
        } else if ((this.gameMode !== msg.gameMode)
                && (msg.gameMode === GM_IN_GAME)) {
            console.log('Starting game from waiting');
            this.onGameStarted();
            this.pending = false;
        }

        if (this.gameMode === GM_IN_GAME) {
            var clans = msg[this.territory].clans;
            for (var i=0;i<clans.length;i++) {
                this.clans[i].points = clans[i];
            }
            this.territoriesDisplay.update(msg.territoryControl);
        } else if (this.gameMode == GM_ENDED && this.pending) {
            // get countdown info
            this.nextGameIn = Math.floor(msg.nextGameIn);
            this.newGameCountdown.update(this.nextGameIn);
        }
    },

    addEntity: function(entity) {
        this.entities.push(entity);
    },

    removeEntity: function(remove) {
        this.entities = _.without(this.entities, remove);
    },

    clanAttack: _.debounce(function() {
        this.socket.emit('click-event', {territory: this.territory});
    }, 50, true),

    updateTerritory: function(id) {
        this.territory = id;
        var region = LocationData.regions[id];
        this.territoryName.text(region.name);
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

    tick: function() {
        // Evaluated by the server
        // simulate the natural decay before
        // the next update from the server
        if (this.gameMode == GM_IN_GAME) {
            this.chart.updateWedges(this.calcControl());
        } else {
            var now = (new Date()).getTime();
            if (this.winScreenLocked && now > this.winScreenLockTimeout) {
                this.tapButton.toggle();
                this.winScreenLocked = false;
            }
        }
        _.each(this.entities, function(entity) {
            entity.tick();
        });
    },

    onEnterFrame: function() {
        this.tick()
        this.scene.render();
    },

    onCanvasClick: function(evt) {
        // var scenePos = this.translateScenePosition(evt);
        // this.newActor(scenePos);
        if (this.gameMode == GM_IN_GAME) {
            this.clanAttack();
        } else if (!this.pending && !this.winScreenLocked) {
            var root = '//' + document.domain
                     + ':'  + location.port + '/';
            window.location = root;
        }
    }
});

$(document).ready(function () {
    window.application = new Application();
    window.application.run();
});
// vim: set sts=4 sw=4 expandtab:
