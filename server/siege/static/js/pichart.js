
var RingOffset = klass.create();
_.extend(RingOffset.prototype, {
    initialize: function() {
        this.speed = 0;
        this.currentOffset = 0.0;
        this.nextDecision = 0;
        this.maxOffset = (Math.PI) / 8;
    },

    setWanderState: function() {
        this.speed = randbound(-0.003, 0.003);
    },

    tick: function() {
        var curTime = (new Date()).getTime();
        if (curTime > this.nextDecision) {
            this.setWanderState();
            this.nextDecision = curTime + Math.round(randbound(2000, 7000));
        }

        this.currentOffset += this.speed;
        if (this.currentOffset > this.maxOffset) {
            this.currentOffset = this.maxOffset;
        } else if (this.currentOffset < -this.maxOffset) {
            this.currentOffset = -this.maxOffset;
        }
    }
});

// May want to track things using polar coords
// and then translating to x,y
var PiChart = klass.create();
_.extend(PiChart.prototype, {
    initialize: function(app, pos, rad, n) {
        this.application = app;
        this.position = pos;
        this.radius = rad;

        this.wedges = [];
        this.wedgeColors = [[255, 78, 78],
                            [78, 255, 78],
                            [78, 78, 255]];
        this.nWedges = n;

        for (var i=0; i<this.nWedges; i++) {
            this.wedges.push(0.0);
        }

        this.rings = 6;
        this.ringOffset = [];

        for (var i=0; i<this.rings; i++) {
            this.ringOffset.push(new RingOffset());
        }
    },

    updateWedges: function(wedgeValues) {
        for (var i=0; i<this.nWedges; i++) {
            var val = wedgeValues[i] || 0;
            this.wedges[i] = val;
        }
    },

    tick: function() {
        for (var i=0; i<this.rings; i++) {
            this.ringOffset[i].tick()
        }
    },

    capPath: function(g, r, w, h, d) {
        var h1 = h - (w/2)
        var x1 = h1 * Math.cos(r) + this.position[0];
        var y1 = h1 * Math.sin(r) + this.position[1];
        var r1 = r + Math.PI;
        g.arc(x1, y1, w/2, r, r1, d);
    },

    renderWedge: function(g, r1, r2, rgba) {
        var ringWidth = (this.radius / (this.rings * 2));
        for (var i = 0; i < this.rings - 2; i++) {
            var ringHeight = this.radius - (i * ringWidth * 2);
            g.beginPath();
            g.fillStyle = rgba;
            var off = this.ringOffset[i].currentOffset;
            g.arc(this.position[0], this.position[1], ringHeight,
                  r1 + off, r2 + off);
            this.capPath(g, r2 + off, ringWidth, ringHeight, false);
            g.arc(this.position[0], this.position[1], ringHeight - ringWidth,
                  r2 + off, r1 + off, true);
            this.capPath(g, r1 + off, ringWidth, ringHeight, true);
            g.fill();
            g.closePath();
        }
    },

    render: function(g) {
        this.tick();
        var last = 0;
        var unclaimed = 1 - _.reduce(this.wedges, function (l, r) {
            return l + r;
        }, 0);
        var buffer = (unclaimed * Math.PI * 2) / this.wedges.length;
        for (var i=0; i<this.wedges.length; i++) {
            var arc = this.wedges[i] * Math.PI * 2 + last;
            if (this.wedges[i] !== 0) {
                this.renderWedge(g, last, arc,
                                 rgbaString(this.wedgeColors[i]));
            }
            last = arc + buffer;
        }
    }
});


// vim: set sts=4 sw=4 expandtab:
