import requests

auth = (
    '',
    ''
    )

fields = {
    'from': '+46766868181',
    'to': '+46xxxxxxxx',
    'voice_start': '{"play":"https://46elks.com/static/sound/make-call.mp3"}'
    }

response = requests.post(
    "https://api.46elks.com/a1/calls",
    data=fields,
    auth=auth
    )

print(response.text)
