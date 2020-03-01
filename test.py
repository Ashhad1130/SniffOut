from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from youtube_transcript_api import YouTubeTranscriptApi
import json
# from pytube import YouTube, Playlist
from apiclient.discovery import build
from apiclient.errors import HttpError
from oauth2client.tools import argparser

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

final_stopWords = []
temp_file = open('stopwords.txt', 'r')
final_stopWords = [line.rstrip('\n') for line in temp_file]

# creating a Flask app
app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET', 'POST'])
# @app.route('/list/<query>/<listId>', methods = ['GET'])
# def youtube_url(query, listId):
#     print(query, listId)
#     # return 'heelo'
#     # videos = pytube_test(query, listId);
#     url = 'https://www.youtube.com/playlist?list='+listId;
#     pl = Playlist(url)
#     # pl.populate_video_urls()  # fills the pl.video_urls with all links from the playlist
#     urls = pl.video_urls
#     # print(urls)
#     videos = list();
#     for url in urls:
#         youtubeObj = YouTube(url)  # here's what you want
#         videoID = YouTube(url).video_id;
#         keywordList = YouTubeTranscriptApi.get_transcript(videoID)
#         videos.append([youtubeObj.title, youtubeObj.thumbnail_url, url, keywordList]);
#         print(videos)
#     returnList = []
#     for i in range(len(videos)):
#         for j in videos[i][-1]:
#             print(i)
#             phrase = i['text']
#             print(phrase)
#             if query.lower() in phrase.lower():
#                 temp = {"timestamp": str(i['start']) + 's',
#                         "phrase": i['text']}
#                 returnList.append(temp)
#     return (json.dumps(returnList));
def fetch_all_youtube_videos(playlistId):
    youtube = build(YOUTUBE_API_SERVICE_NAME,
                    YOUTUBE_API_VERSION,
                    developerKey=DEVELOPER_KEY)
    res = youtube.playlistItems().list(part="snippet",
                                       playlistId=playlistId,
                                       maxResults="50").execute()

    nextPageToken = res.get('nextPageToken')
    while ('nextPageToken' in res):
        nextPage = youtube.playlistItems().list(
            part="snippet",
            playlistId=playlistId,
            maxResults="50",
            pageToken=nextPageToken).execute()
        res['items'] = res['items'] + nextPage['items']

        if 'nextPageToken' not in nextPage:
            res.pop('nextPageToken', None)
        else:
            nextPageToken = nextPage['nextPageToken']

    return res


@app.route('/list/<query>/<listId>', methods=['GET'])
def youtube_url(query, listId):
    videos = fetch_all_youtube_videos(listId)
    videoDetails = {"items": []}
    for item in videos["items"]:
        item1 = item["snippet"]
        vidID = item1["resourceId"]["videoId"]
        # returnList = []
        # keywordList = YouTubeTranscriptApi.get_transcript(vidID)
        # for i in keywordList:
        #     phrase = i['text']
        #     if query.lower() in phrase.lower():
        #         temp = {
        #             "timestamp": str(i['start']) + 's',
        #             "phrase": i['text']
        #         }
        #         returnList.append(temp)
        # print(returnList)
        thumbnail_url = item1["thumbnails"]["medium"]
        title = item1["title"]
        if query.lower() in title.lower():
            videoDetails["items"].append({
                # "caption": returnList,
                "title": title,
                "thumbnail_url": thumbnail_url,
                "url": vidID
            })

    return videoDetails


@app.route('/<query>/<videoID>', methods=['GET'])
def getJSON(videoID, query):
    returnList = []
    if query in final_stopWords:  #if the query is not good enough to be searched,return -1
        return (json.dumps(returnList))
    keywordList = YouTubeTranscriptApi.get_transcript(videoID)
    print(keywordList)
    # with open('sub.txt', 'w') as f:
    #     for line in keywordList:
    #         f.write(line['text']+"\n")
    #     f.close()
    print(keywordList)
    for i in keywordList:
        # print(i)
        phrase = i['text']
        # print(phrase)
        if query.lower() in phrase.lower():
            temp = {"timestamp": str(i['start']) + 's', "phrase": i['text']}
            returnList.append(temp)

    return (json.dumps(returnList))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5000', threaded=True, debug=True)
