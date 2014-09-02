import math
import gevent

from siege.models import Game


class Territory(object):

    def __init__(self, id):
        self.id = id
        self.clan_power = []
        for i in xrange(3): # TODO: Num clans
            self.clan_power.append(0.0)

    def apply_updates(self, clan_updates):
        self.decay()
        clans = self.clan_power
        for i in xrange(3):
            clans[i] += clan_updates.get(i, 0)

    def decay(self):
        clans = self.clan_power
        for i in xrange(len(clans)):
            p = clans[i]
            clans[i] = p - math.ceil(p * 0.10)


class GameManager(object):

    def __init__(self, socketio):
        # Keep a handle to socketio in order to emit events
        self.socketio = socketio
        self.territories = []
        self.event_queue = []
        self.current_game = None
        for i in xrange(4): # TODO: Num territories
            self.territories.append(Territory(i))

    def register_click(self, device, player):
        power = 100 + device.bonus
        self.event_queue.append(
                ('click', player.id, player.clan,
                 player.current_territory, power))

    def process_events(self):
        territory_updates = {}
        # Compress events into sets up territory updates
        for event in self.event_queue:
            name, pid, cid, tid, p = event
            if tid not in territory_updates:
                territory_updates[tid] = {}
            if cid not in territory_updates[tid]:
                territory_updates[tid][cid] = 0.0
            territory_updates[tid][cid] += p
        self.event_queue = []

        for i, territory in enumerate(self.territories):
            territory.apply_updates(territory_updates.get(i, {}))

    def run(self):
        # This is basically the the game run loop
        # This will evaluate the current state according
        # to what's been registered against the model
        # and transition states/notify clients appropriately
        while True:
            gevent.sleep(0.20)
            if not self.current_game:
                self.current_game = Game.current()
            if not self.current_game:
                self.current_game = Game.create()
            self.process_events()
            msg = {}
            for t in self.territories:
                msg[t.id] = dict(clans=t.clan_power)
            self.socketio.emit('game-update', msg, namespace='/game')
