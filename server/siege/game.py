import math
import gevent

from siege.models import Game
from siege.models import Device
from siege.models import Player


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

        # Entity caching
        self.devices = {}
        self.players = {}

        # Scoring
        self.territories = []

        # Event caching for game loop
        self.event_queue = []
        self.current_game = None

        # Initialize territories
        for i in xrange(4): # TODO: Num territories
            self.territories.append(Territory(i))

    def get_device(self, device_id):
        if device_id not in self.devices:
            device = Device.query.get(device_id)
            if not device:
                return None
            self.devices[device_id] = device
        else:
            device = self.devices[device_id]
        return device

    def get_player(self, device_id):
        if device_id not in self.players:
            player = Player.current(device_id)
            print(repr(player))
            if not player:
                return None
            self.players[device_id] = player
        else:
            player = self.players[device_id]
        return player

    def register_click(self, device_id):
        device = self.get_device(device_id)
        if not device:
            return

        player = self.get_player(device_id)
        if not player:
            return

        power = 100 + device.bonus
        event = ('click', player.id, player.clan,
                 player.current_territory, power)
        self.event_queue.append(event)

    def process_click(self, event, territory_updates):
        name, pid, cid, tid, p = event
        if tid not in territory_updates:
            territory_updates[tid] = {}
        if cid not in territory_updates[tid]:
            territory_updates[tid][cid] = 0.0
        territory_updates[tid][cid] += p

    def process_events(self):
        territory_updates = {}
        # device_updates = {}
        # Compress events into sets
        for event in self.event_queue:
            name = event[0]
            if name == 'click':
                self.process_click(event, territory_updates)
        self.event_queue = []

        for i, territory in enumerate(self.territories):
            territory.apply_updates(territory_updates.get(i, {}))

    def run(self):
        # This is basically the the game run loop
        # This will evaluate the current state according
        # to what's been registered against the model
        # and transition states/notify clients appropriately
        while True:
            if not self.current_game:
                self.current_game = Game.current()
            if not self.current_game:
                self.current_game = Game.create()
            self.process_events()
            msg = {}
            for t in self.territories:
                msg[t.id] = dict(clans=t.clan_power)
            self.socketio.emit('game-update', msg, namespace='/game')
            # Get elapsed time and update the sleep duration
            gevent.sleep(0.20)
