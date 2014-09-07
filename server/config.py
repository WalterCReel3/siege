import datetime

config = {
    'db': {
        'uri': 'postgresql:///siege',
        'echo': True
    },

    'flask': {
        # The host or interface to bind to
        'bind': '0.0.0.0',

        # Enables the Flask debugger (never enable this in production)
        'debug': True,

        # Secret key for signing session cookies
        'session_secret_key': 'c05014dd54cc614501ffc5cbe94d14e9d28de4ffc9cbbfcac167620a9fa2af0e'
    },

    # These entities get created if they don't exist each time the server starts
    'init': {
        'devices': [
            {
                'id': 'znemxs63dyddy',
                'bonus': 0,
                'comment': 'First battlestation'
            },
            {
                'id': 'kjdobbempami4',
                'bonus': 0,
                'comment': 'Second battlestation'
            },
            {
                'id': 'hguxnrsq4vdq4',
                'bonus': 0,
                'comment': 'Third battlestation'
            }
        ]
    },

    # A new game starts with these entities
    'game_template': {
        'players': [
            {'device_id': 'znemxs63dyddy', 'clan': 0, 'territory': 0},
            # Second battlestation
            {'device_id': 'kjdobbempami4', 'clan': 1, 'territory': 0},
            # Third battlestation
            {'device_id': 'hguxnrsq4vdq4', 'clan': 2, 'territory': 0}
        ]
    },

    # Thresholds for moving up rank (events, not points)
    'ranks': [10, 250, 750, 1500],

    # The known clan numbers (for random assignment)
    'clans': [0, 1, 2]
}
