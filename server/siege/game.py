import math
import time
import gevent
from operator import itemgetter

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
        self.players_by_clan = {}
        for i in xrange(3):
            self.players_by_clan[i] = []

        # Scoring
        self.territories = []

        # Event processing
        self.event_queue = []
        self.territory_updates = None
        self.device_updates = None

        # Current game
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
            if not player:
                return None
            self.players[device_id] = player
            self.players_by_clan[player.clan].append(player)
        else:
            player = self.players[device_id]
        return player

    def create_player(self, device):
        clan_sizes = [(clan_id, len(self.players_by_clan.get(clan_id, [])))
                      for clan_id in xrange(3)]
        clan_sizes.sort(key=itemgetter(1))
        clan = clan_sizes[0][0]
        territory = 0
        player = Player.create(self.current_game.id, device.id, clan,
                               territory)

    def register_click(self, device_id):
        device = self.get_device(device_id)
        if not device:
            return

        player = self.get_player(device_id)
        if not player:
            return

        power = 100 + device.bonus
        event = ('click', player.device_id, player.id, player.clan,
                 player.current_territory, power)
        self.event_queue.append(event)

    def process_click(self, event):
        name, did, pid, cid, tid, p = event
        if tid not in self.territory_updates:
            self.territory_updates[tid] = {}
        if cid not in self.territory_updates[tid]:
            self.territory_updates[tid][cid] = 0.0
        self.territory_updates[tid][cid] += p

        if did not in self.device_updates:
            self.device_updates[did] = 0
        self.device_updates[did] += 1

    def process_events(self):
        self.territory_updates = {}
        self.device_updates = {}
        # Compress events into sets
        for event in self.event_queue:
            name = event[0]
            if name == 'click':
                self.process_click(event)
        self.event_queue = []

        for i, territory in enumerate(self.territories):
            territory.apply_updates(self.territory_updates.get(i, {}))

    def load_game(self):
        # Get current game
        self.current_game = Game.current()
        # get players if there is a game
        if self.current_game:
            players = Player.query.filter_by(game_id=self.current_game.id)
            for player in players:
                clan_id = player.clan
                self.players[player.device_id] = player
                clan_players = self.players_by_clan.get(clan_id, [])
                clan_players.append(player)
                self.players_by_clan[clan_id] = clan_players

    def run(self):
        # This is basically the the game run loop
        # This will evaluate the current state according
        # to what's been registered against the model
        # and transition states/notify clients appropriately
        while True:
            t1 = time.clock()

            if not self.current_game:
                self.load_game()
            if not self.current_game:
                self.current_game = Game.create()

            self.process_events()

            msg = {}
            msg['game_mode'] = 'in-game'
            msg['clan_sizes'] = [len(self.players_by_clan[c])
                                 for c in xrange(3)]
            for t in self.territories:
                msg[t.id] = dict(clans=t.clan_power)
            self.socketio.emit('game-update', msg, namespace='/game')

            t2 = time.clock()
            td = t2 - t1
            wait = (0.2 - td) if td < 0.2 else 0
            gevent.sleep(wait)
