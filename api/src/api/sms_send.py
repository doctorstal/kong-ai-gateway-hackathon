import requests

response = requests.post('https://api.46elks.com/a1/sms',
auth = ('', ''),
  data = {
    'from': 'TeamAPINinjas',
    'to': '+46xxxxxxxx',
    'message': "Confirm your email please."}
)
print(response.text)
