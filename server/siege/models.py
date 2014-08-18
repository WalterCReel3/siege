import json

from sqlalchemy.schema import *
from sqlalchemy.types import *
from sqlalchemy.orm import *

from siege.service import db


class Device(db.Model):
    __tablename__ = 'devices'
    id = Column(Integer, primary_key=True)
    rank = Column(Integer, default=0)
    bonus = Column(BigInteger, default=0)
    comment = Column(Text)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def json_dict(self):
        return dict(id=self.id,
                    rank=self.rank,
                    bonus=self.bonus,
                    comment=self.comment)


class Game(db.Model):
    __tablename__ = 'games'
    id = Column(Integer, primary_key=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    players = relation('Player')
    points = relation('Points')

    def __init__(self, **kwargs):
        self.started_at = Date()
        for k, v in kwargs.items():
            setattr(self, k, v)

    def json_dict(self):
        return dict(id=self.id,
                    startedAt=self.started_at,
                    endedAt=self.ended_at,
                    comment=self.comment)

class Player(db.Model):
    __tablename__ = 'players'
    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey('games.id'), nullable=False)
    device_id = Column(Integer, ForeignKey('devices.id'), nullable=False)
    clan = Column(Integer, nullable=False)
    current_territory = Column(Integer, nullable=False)
    comment = Column(Text)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


class Points(db.Model):
    __tablename__ = 'points'
    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey('games.id'), nullable=False)
    territory = Column(Integer, nullable=False)
    points = Column(BigInteger, nullable=False, default=0)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
