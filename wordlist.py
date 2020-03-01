from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from youtube_transcript_api import YouTubeTranscriptApi
import json
import re
from apiclient.discovery import build  #pip install google-api-python-client
from apiclient.errors import HttpError  #pip install google-api-python-client
from oauth2client.tools import argparser  #pip install oauth2client
import pandas as pd  #pip install pandas
import matplotlib as plt
from monkey import get_details
from collections import Counter

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

final_stopWords = []
temp_file = open('stopwords.txt', 'r')
final_stopWords = [line.rstrip('\n') for line in temp_file]

# creating a Flask app
app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET', 'POST'])
def homeRoute():
    pass


@app.route('/<videoID>', methods=['GET'])
def getJSON(videoID):
    returnList = []
    keywordList = YouTubeTranscriptApi.get_transcript(videoID)
    lump = []
    for i in keywordList:
        phrase = i['text']
        # print(phrase)
        for j in re.sub(r'[^\w\s]', '', phrase).lower().split(" "):
            if j.split("\n")[0] not in final_stopWords:
                temp = {"word": str(j.lower())}
                lump.append(str(j.lower()))
                returnList.append(temp)
                # print(j)
    # print(lump)
    cnt = Counter(lump)
    sorted_x = sorted(cnt.items(), key=lambda kv: kv[1], reverse=True)
    lum = []
    # print(sorted_x)
    for i in range(0, 6):
        lum.append(sorted_x[i][0])
    # cnt1 = list(cnt.keys())
    # print(cnt1)
    # cnt1 = cnt1[:6]
    # print(cnt1)
    # print(cnt)
    returnList.append({"frequents": lum})
    return (json.dumps(returnList))


@app.route('/plot/<vidId>', methods=['GET'])
def plot(vidId):
    index = vidId.find('list=')
    # print(index, vidId)
    if (index != -1):
        vidId = vidId[:index - 1]
        # print(vidId)
    youtube = build(YOUTUBE_API_SERVICE_NAME,
                    YOUTUBE_API_VERSION,
                    developerKey=DEVELOPER_KEY)
    videos_list_response = youtube.videos().list(
        id=vidId, part='id,statistics').execute()
    # print(videos_list_response)
    return (json.dumps(videos_list_response))


@app.route('/compare/<vidId>', methods=['GET'])
def compare(vidId):
    index = vidId.find('list=')
    # print(index, vidId)
    if (index != -1):
        vidId = vidId[:index - 1]
        # print(vidId)
    youtube = build(YOUTUBE_API_SERVICE_NAME,
                    YOUTUBE_API_VERSION,
                    developerKey=DEVELOPER_KEY)
    video = youtube.videos().list(id=vidId, part='id, snippet').execute()
    videoTitle = video["items"][0]["snippet"]["localized"]["title"]
    print(videoTitle)
    res = get_details(videoTitle)
    return (json.dumps(res))


# driver function
if __name__ == '__main__':

    app.run(host='0.0.0.0', port='5002', threaded=True, debug=True)
