import requests

auth = (
    'u7492ce1814e8ff2183c5bc225bf5cb51',
    'A8AFAAC4408B0B684EC630FB1BCFF6E8'
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
