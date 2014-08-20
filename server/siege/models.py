import os
import base64
import datetime

from sqlalchemy.schema import *
from sqlalchemy.types import *
from sqlalchemy.orm import *

from siege.service import db


def _new_id():
    return base64.b32encode(os.urandom(8)).lower().rstrip('=')


class Device(db.Model):
    __tablename__ = 'devices'
    id = Column(Text, primary_key=True, default=_new_id)
    rank = Column(Integer, default=0)
    bonus = Column(BigInteger, default=0)
    comment = Column(Text)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return dict(id=self.id,
                    rank=self.rank,
                    bonus=self.bonus,
                    comment=self.comment)


class Game(db.Model):
    __tablename__ = 'games'
    id = Column(Text, primary_key=True, default=_new_id)
    started_at = Column(DateTime, nullable=False, default=datetime.datetime.now())
    ended_at = Column(DateTime, nullable=True)
    players = relation('Player')
    points = relation('Points')

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        return dict(id=self.id,
                    startedAt=self.started_at,
                    endedAt=self.ended_at,
                    comment=self.comment)


class Player(db.Model):
    __tablename__ = 'players'
    id = Column(Text, primary_key=True, default=_new_id)
    game_id = Column(Text, ForeignKey('games.id'), nullable=False)
    device_id = Column(Text, ForeignKey('devices.id'), nullable=False)
    clan = Column(Integer, nullable=False)
    current_territory = Column(Integer, nullable=False)
    comment = Column(Text)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


class Points(db.Model):
    __tablename__ = 'points'
    id = Column(Text, primary_key=True, default=_new_id)
    game_id = Column(Text, ForeignKey('games.id'), nullable=False)
    territory = Column(Integer, nullable=False)
    points = Column(BigInteger, nullable=False, default=0)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
