from bottle import request, post, run
import json

@post('/calls')
def calls():
  print("You have received a phone call")
  return {
    "play":"https://46elks.com/static/sound/testcall.mp3"}

@post('/sms')
def sms():
  print("You have received an SMS")
  return {
    "reply": "Thank you for your message"}

run(host='0.0.0.0', port=5501)
