import requests

auth = (
    '',
    ''
    )

fields = {
    'from': '+46723726419',
    'to': '+46723726419',
    'voice_start': '{"play":"https://46elks.com/static/sound/make-call.mp3"}'
    }

response = requests.post(
    "https://api.46elks.com/a1/calls",
    data=fields,
    auth=auth
    )

print(response.text)
