import math
import gevent

class GameManager(object):
    
    def __init__(self, socketio):
        # Keep a handle to socketio in order to emit events
        self.socketio = socketio
        self.clan_power = [0.0, 0.0, 0.0]

    def register_click(self, message):
        clan_id = message['id']
        power = message['power']
        self.clan_power[clan_id] += power

    def evaluate_control(self):
        clans = self.clan_power
        for i in xrange(len(clans)):
            p = clans[i]
            clans[i] = p - math.ceil(p * 0.10)

    def run(self):
        # This is basically the the game run loop
        # This will evaluate the current state according
        # to what's been registered against the model
        # and transition states/notify clients appropriately
        while True:
            gevent.sleep(0.20)
            self.evaluate_control()
            msg = dict(clans=self.clan_power)
            self.socketio.emit('game-update', msg, namespace='/game')
