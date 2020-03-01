from apiclient.discovery import build  #pip install google-api-python-client
from apiclient.errors import HttpError  #pip install google-api-python-client
from oauth2client.tools import argparser  #pip install oauth2client
import pandas as pd  #pip install pandas
import matplotlib as plt

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"


def get_details(title):
    # argparser.add_argument("--d", help="Search term", default=title)
    # #change the default to the search term you want to search
    # argparser.add_argument("--max-results", help="Max results", default=5)
    # #default number of results which are returned. It can very from 0 - 100
    # args = argparser.parse_args()
    # options = args

    youtube = build(YOUTUBE_API_SERVICE_NAME,
                    YOUTUBE_API_VERSION,
                    developerKey=DEVELOPER_KEY)

    # Call the search.list method to retrieve results matching the specified
    # query term.
    search_response = youtube.search().list(q=title,
                                            type="video",
                                            part="id,snippet",
                                            maxResults=5).execute()

    videos = {}

    for search_result in search_response.get("items", []):
        if search_result["id"]["kind"] == "youtube#video":
            videos[search_result["id"]
                   ["videoId"]] = search_result["snippet"]["title"]

    s = ','.join(videos.keys())

    videos_list_response = youtube.videos().list(
        id=s, part='id,statistics').execute()

    res = []
    for i in videos_list_response['items']:
        temp_res = dict(v_id=i['id'], v_title=videos[i['id']])
        temp_res.update(i['statistics'])
        res.append(temp_res)
    return res
