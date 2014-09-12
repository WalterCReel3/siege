import math
import time
import gevent
from operator import itemgetter

from siege.models import Game
from siege.models import Device
from siege.models import Player
from siege.service import config


DEBUG = True
MINIMUM_HOLD_TIME = 5.0
MINIMUM_HOLD_PERCENTAGE = 0.5
POWER_THRESHOLD = 2000
GAME_RESET_TIME = 30


GM_IN_GAME = 0
GM_ENDED = 1


class Territory(object):

    def __init__(self, id):
        self.id = id

        # current clan power for the territory
        self.clan_power = []

        # For tracking pending control
        # if held for a set duration
        self.pending_clan = -1
        self.control_start = None

        # Current clan who gained control
        self.controlling_clan = -1

        self.reset()

    def reset(self):
        self.clan_power = []
        self.controlling_clan = -1
        for i in xrange(3): # TODO: Num clans
            self.clan_power.append(0.0)

    def apply_updates(self, clan_updates):
        self.decay()
        clans = self.clan_power
        for i in xrange(3):
            clans[i] += clan_updates.get(i, 0)
        self.evaluate_control()

    def decay(self):
        clans = self.clan_power
        for i in xrange(len(clans)):
            p = clans[i]
            clans[i] = p - math.ceil(p * 0.10)

    def clan_controlling(self, clan_id):
        self.pending_clan = clan_id
        now = time.time()
        if not self.control_start:
            self.control_start = now
            return

        difference = now - self.control_start
        if difference > MINIMUM_HOLD_TIME:
            self.controlling_clan = clan_id

    def no_controller(self):
        self.pending_clan = -1
        self.control_start = None

    def evaluate_control(self):
        clans = self.clan_power
        total_power = sum(clans)
        base_power = total_power

        if base_power == 0:
            self.no_controller()
            return

        if base_power < POWER_THRESHOLD:
            base_power = POWER_THRESHOLD

        clan_control = [clan / base_power for clan in clans]
        controlled = False
        for clan_id, control in enumerate(clan_control):
            if control > MINIMUM_HOLD_PERCENTAGE:
                controlled = True
                break
        if controlled:
            self.clan_controlling(clan_id)
        else:
            self.no_controller()

    def to_dict(self):
        return dict(id=self.id,
                    controlling_clan=self.controlling_clan)


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
        self.game_mode = GM_IN_GAME
        self.winner = -1

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
        return player

    def register_click(self, device_id, territory):
        device = self.get_device(device_id)
        if not device:
            return

        player = self.get_player(device_id)
        if not player:
            return

        if territory is None:
            territory = player.current_territory

        player.update_territory(territory)
        power = 100 + device.bonus
        event = ('click', player.device_id, player.id, player.clan,
                 territory, power)
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

    def evaluate_control(self):
        # for each territory we want to evaluate
        # the control of the territory
        pass

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

    def init_game(self):
        game = Game.create()
        # add the players defined inthe game template
        for p in config['game_template']['players']:
            Player.create(game.id, p['device_id'], p['clan'], p['territory'])
        self.winner = -1
        return game

    def game_state(self):
        if DEBUG:
            clan_id = self.territories[0].controlling_clan
            if clan_id != -1:
                return True, clan_id
            else:
                return False, -1

        for i in xrange(len(self.territories) - 1):
            c1 = self.territories[i].controlling_clan
            c2 = self.territories[i+1].controlling_clan
            if c1 == -1 or c2 == -1:
                return False, -1
            if c1 != c2:
                return False, -1
        return True, self.territories[0].controlling_clan

    def add_default_player_locations(self, msg):
        player_territories = {}
        for p in config['game_template']['players']:
            device_id = p['device_id']
            player = self.players[device_id]
            player_territories[device_id] = player.current_territory
        msg['playerTerritories'] = player_territories

    def create_in_game_message(self):
        territory_control = [t.to_dict() for t in self.territories]
        clan_sizes = [len(self.players_by_clan[c]) for c in xrange(3)]
        msg = {}
        msg['gameMode'] = 'in-game'
        msg['territoryControl'] = territory_control
        msg['clanSizes'] = clan_sizes
        for t in self.territories:
            msg[str(t.id)] = dict(clans=t.clan_power)
        self.add_default_player_locations(msg)
        return msg

    def create_ended_message(self):
        display_power = [0, 0, 0]
        display_power[self.winner] = POWER_THRESHOLD
        msg = {}
        msg['gameMode'] = 'ended'
        # Make a solid color for the display
        for t in self.territories:
            msg[str(t.id)] = dict(clans=display_power)
        self.add_default_player_locations(msg)
        return msg

    def emit_game_update(self):
        if self.game_mode == GM_IN_GAME:
            msg = self.create_in_game_message()
        elif self.game_mode == GM_ENDED:
            msg = self.create_ended_message()
        self.socketio.emit('game-update', msg, namespace='/game')

    def end_game(self, winner):
        self.winner = winner
        self.game_mode = GM_ENDED
        self.reset_at = time.time() + GAME_RESET_TIME
        game = Game.current()
        game.end()
        self.current_game = None
        self.players = {}
        for territory in self.territories:
            territory.reset()
        self.players_by_clan = {}
        for i in xrange(3):
            self.players_by_clan[i] = []
        self.event_queue = []
        self.territory_updates = None
        self.device_updates = None

    def run(self):
        # This is basically the the game run loop
        # This will evaluate the current state according
        # to what's been registered against the model
        # and transition states/notify clients appropriately
        while True:
            t1 = time.clock()

            if self.game_mode == GM_IN_GAME:
                if not self.current_game:
                    self.load_game()
                if not self.current_game:
                    self.current_game = self.init_game()
                self.process_events()
                ended, winner = self.game_state()
                if ended:
                    self.end_game(winner)
            elif self.game_mode == GM_ENDED:
                now = time.time()
                if now > self.reset_at:
                    self.game_mode = GM_IN_GAME

            self.emit_game_update()

            t2 = time.clock()
            td = t2 - t1
            wait = (0.2 - td) if td < 0.2 else 0
            gevent.sleep(wait)
