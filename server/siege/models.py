import os
import base64
import datetime
import time

from sqlalchemy.schema import *
from sqlalchemy.types import *
from sqlalchemy.orm import *

from siege.service import db


# Creates a random text ID
def new_id():
    return base64.b32encode(os.urandom(8)).lower().rstrip('=')


# Gets a Unix timestamp number from a Python datetime or None
def unixtime(dt):
    # I can't remember if some date values are falsy, so use 'is None'
    if dt is None:
        return None
    return int(time.mktime(dt.timetuple()))


class Device(db.Model):
    __tablename__ = 'devices'
    id = Column(Text, primary_key=True, default=new_id)
    created_at = Column(DateTime, nullable=False,
                        default=datetime.datetime.utcnow())
    rank = Column(Integer, default=0)
    bonus = Column(BigInteger, default=0)
    comment = Column(Text)

    players = relation('Player', backref='device')
    total_clicks = Column(BigInteger, default=0)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return dict(id=self.id,
                    createdAt=unixtime(self.created_at),
                    rank=self.rank,
                    bonus=self.bonus,
                    comment=self.comment)

    @staticmethod
    def create(remote_addr, user_agent):
        comment = '%s, %s' % (remote_addr, user_agent)
        new_device = Device(comment=comment)
        db.session.add(new_device)
        db.session.commit()
        return new_device


class Game(db.Model):
    __tablename__ = 'games'
    id = Column(Text, primary_key=True, default=new_id)
    started_at = Column(DateTime, nullable=False,
                        default=datetime.datetime.utcnow())
    ended_at = Column(DateTime, nullable=True)

    players = relation('Player', backref='game')
    points = relation('Points', backref='game')

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return dict(id=self.id,
                    startedAt=unixtime(self.started_at),
                    endedAt=unixtime(self.ended_at),
                    numPlayers=len(self.players))

    def end(self):
        self.ended_at = datetime.datetime.utcnow()
        db.session.commit()

    @staticmethod
    def current():
        return (Game.query.filter_by(ended_at=None)
                          .order_by(Game.started_at)
                          .limit(1)
                          .first())

    @staticmethod
    def create():
        ret = Game()
        db.session.add(ret)
        db.session.commit()
        return ret


class Player(db.Model):
    __tablename__ = 'players'
    id = Column(Text, primary_key=True, default=new_id)
    game_id = Column(Text, ForeignKey('games.id'), nullable=False)
    device_id = Column(Text, ForeignKey('devices.id'), nullable=False)
    created_at = Column(DateTime, nullable=False,
                        default=datetime.datetime.utcnow())
    clan = Column(Integer, nullable=False)
    current_territory = Column(Integer, nullable=True)
    comment = Column(Text)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return dict(id=self.id,
                    gameId=self.game_id,
                    deviceId=self.device_id,
                    createdAt=unixtime(self.created_at),
                    clan=self.clan,
                    currentTerritory=self.current_territory,
                    comment=self.comment)

    def update_territory(self, territory):
        if territory == self.current_territory:
            return
        self.current_territory = territory
        db.session.commit()

    @staticmethod
    def current(device_id):
        game = Game.current()
        if not game:
            return None
        q = Player.query.filter_by(game_id=game.id, device_id=device_id)
        ret = q.first()
        return ret

    @staticmethod
    def create(game_id, device_id, clan_id, territory_id):
        ret = Player(game_id=game_id,
                     device_id=device_id,
                     clan=clan_id,
                     current_territory=territory_id)
        db.session.add(ret)
        db.session.commit()
        return ret


class Points(db.Model):
    __tablename__ = 'points'
    id = Column(Text, primary_key=True, default=new_id)
    game_id = Column(Text, ForeignKey('games.id'), nullable=False, index=True)
    territory = Column(Integer, nullable=False, index=True)
    points = Column(BigInteger, nullable=False, default=0)

    __table_args__ = (UniqueConstraint(game_id, territory),)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    @staticmethod
    def score(game_id, territory, points):
        # Must lock table to ensure atomicity for the upsert hack.
        db.session.execute(
                'begin;'
                'lock table points in share row exclusive mode;'
                'with upsert as '
                '(update points set points = points + :points '
                    'where game_id = :game_id '
                    'and territory = :territory returning *) '
                'insert into points (id, game_id, territory, points) '
                'select :id, :game_id, :territory, :points '
                    'where not exists (select * from upsert);'
                'commit;',
                dict(id=new_id(), points=points, game_id=game_id,
                     territory=territory))
