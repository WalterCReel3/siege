
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
    initialize: function(pos, rad) {
        this.position = pos;
        this.radius = rad;

        this.factions = [0.25, 0.43, 0.10];
        this.fcolors = [randcolor(), randcolor(), randcolor()];

        this.rings = 10;
        this.ringOffset = [];

        for (var i=0; i<this.rings; i++) {
            this.ringOffset.push(new RingOffset());
        }
    },

    tick: function() {
        for (var i=0; i<this.rings; i++) {
            this.ringOffset[i].tick()
        }
    },

    renderFactionFraction: function(g, r1, r2, rgba) {
        var ring_width = (this.radius / (this.rings * 2));
        for (var i = 0; i < this.rings - 2; i++) {
            var ring_height = this.radius - (i * ring_width * 2);
            g.beginPath();
            g.fillStyle = rgba;
            var off = this.ringOffset[i].currentOffset;
            g.arc(this.position[0], this.position[1], ring_height,
                  r1 + off, r2 + off);
            g.arc(this.position[0], this.position[1], ring_height - ring_width,
                  r2 + off, r1 + off, true);
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


// vim: set sts=4 sw=4 expandtab:
