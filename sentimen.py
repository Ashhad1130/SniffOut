from flask import Flask, jsonify, request, render_template
from flask_cors import CORS, cross_origin
from youtube_transcript_api import YouTubeTranscriptApi
import json

import sys
import re
from google.cloud import language_v1
from google.cloud.language_v1 import enums
from youtube_transcript_api import YouTubeTranscriptApi
import bs4
import requests
#Data Visualization

#Spacy loading
import spacy
spacy.load('en_core_web_sm')
from spacy.lang.en import English
parser = English()

import nltk
nltk.download('wordnet')
from nltk.corpus import wordnet as wn

from nltk.stem.wordnet import WordNetLemmatizer

nltk.download('stopwords')
en_stop = set(nltk.corpus.stopwords.words('english'))

import random

final_stopWords = []
temp_file = open('stopwords.txt', 'r')
final_stopWords = [line.rstrip('\n') for line in temp_file]

from gensim import corpora

import pickle
import gensim

import pyLDAvis.gensim

# creating a Flask app
app = Flask(__name__)
CORS(app)


def getListFromDict(dict):
    dictlist = []
    for x in dict:
        dictlist.append(x['text'])
    return dictlist


def getFullPhrase(query, dictList):
    listOfPhrases = []
    for phrase in dictList:
        if query.lower() in phrase.lower().split(" "):
            idx = dictList.index(phrase)
            if idx == 0:
                listOfPhrases.append(dictList[idx] + " " + dictList[idx + 1])
            elif idx == len(dictList) - 1:
                listOfPhrases.append(dictList[idx - 1] + " " + dictList[idx])
            else:
                listOfPhrases.append(dictList[idx - 1] + " " + dictList[idx] +
                                     " " + dictList[idx + 1])
        # listOfPhrases.append(dictList[idx])
    return listOfPhrases


def totalKeywordscore(a, b, c):
    numerator = 0
    denominator = 0
    for i in range(len(a)):
        numerator += (a[i] * b[i] * c[i])
        denominator += (b[i] * a[i])

    positive = 0.0
    negative = 0.0
    neutral = 0.0

    for i in range(len(a)):
        if float(c[i]) > 0.01:
            # print("positve",c[i])
            positive += a[i]
        elif float(c[i]) < -0.01:
            # print("negative",type(c[i]))
            negative += a[i]
        else:
            # print("neutral here",c[i])
            neutral += a[i]

    pos = positive / (positive + neutral + negative)
    neu = neutral / (positive + neutral + negative)
    neg = negative / (positive + neutral + negative)
    print(numerator, denominator)
    try:
        return numerator / denominator, pos, neg, neu
    except ZeroDivisionError:
        pass


def sample_analyze_entity_sentiment(text_content, query):
    type_ = enums.Document.Type.PLAIN_TEXT
    language = "en"
    document = {"content": text_content, "type": type_, "language": language}
    encoding_type = enums.EncodingType.UTF8
    client = language_v1.LanguageServiceClient()
    response = client.analyze_entity_sentiment(document,
                                               encoding_type=encoding_type)
    # Loop through entitites returned from the API
    salience = []
    score = []
    magnitude = []

    for entity in response.entities:
        if query.lower() in re.sub(r'[^\w\s]', '',
                                   entity.name).lower().split(" "):
            salience.append(entity.salience)
            sentiment = entity.sentiment
            score.append(sentiment.score)
            magnitude.append(sentiment.magnitude)
    return salience, magnitude, score


def merge(keywordList):
    returnList = ""
    for i in keywordList:
        # print(i["text"])
        returnList += " " + i["text"]
    # print(returnList)
    return returnList


@app.route('/<vidId>', methods=['GET'])
def insight(vidId):
    text_data = []
    keyWordList = YouTubeTranscriptApi.get_transcript(vidId)
    # print(keyWordList)
    for line in keyWordList:
        # print(line['text'])

        tokens = prepare_text_for_lda(line['text'])
        if random.random() > .85:
            # print(tokens)
            text_data.append(tokens)
    #genism

    dictionary = corpora.Dictionary(text_data)
    corpus = [dictionary.doc2bow(text) for text in text_data]

    pickle.dump(corpus, open('corpus.pkl', 'wb'))
    dictionary.save('dictionary.gensim')

    #topics

    NUM_TOPICS = 5
    ldamodel = gensim.models.ldamodel.LdaModel(corpus,
                                               num_topics=NUM_TOPICS,
                                               id2word=dictionary,
                                               passes=55)
    ldamodel.save('model5.gensim')
    topics = ldamodel.print_topics(num_words=4)
    # for topic in topics:
    #     print(topic)
    #Displaying
    dictionary = gensim.corpora.Dictionary.load('dictionary.gensim')
    corpus = pickle.load(open('corpus.pkl', 'rb'))
    lda = gensim.models.ldamodel.LdaModel.load('model5.gensim')

    lda_display = pyLDAvis.gensim.prepare(lda,
                                          corpus,
                                          dictionary,
                                          sort_topics=False)
    pyLDAvis.display(lda_display)
    pyLDAvis.save_html(lda_display, './frontend/lda.html')
    f = open("./frontend/lda.html", encoding="utf8")

    soup = bs4.BeautifulSoup(f)
    scr = soup.select("script")
    with open("./frontend/new.js", 'w') as b:
        src = scr[0].getText().replace(
            'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min',
            '/js/d3.min.js', 1)
        src1 = src.replace(
            'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js',
            '/js/d3.min.js', 1)
        src2 = src1.replace(
            'https://cdn.rawgit.com/bmabey/pyLDAvis/files/ldavis.v1.0.0.js',
            '/js/ldavis.js', 2)
        b.write(src2)
        b.close()
    div = soup.select('div')
    link = soup.select('link')
    print(div[0], link[0])
    with open("./frontend/lda.html", 'w') as b:
        b.write(str(link[0]))
        print('\n')
        b.write(str(div[0]))
        b.write('<script src="new.js"></script>')

    return ""


def tokenize(text):
    lda_tokens = []
    tokens = parser(text)
    for token in tokens:
        if token.orth_.isspace():
            continue
        elif token.like_url:
            lda_tokens.append('URL')
        elif token.orth_.startswith('@'):
            lda_tokens.append('SCREEN_NAME')
        else:
            lda_tokens.append(token.lower_)
    return lda_tokens


#Nltk


def get_lemma(word):
    lemma = wn.morphy(word)
    if lemma is None:
        return word
    else:
        return lemma


def get_lemma2(word):
    return WordNetLemmatizer().lemmatize(word)


# Lda preparation
def prepare_text_for_lda(text):
    tokens = tokenize(text)
    tokens = [token for token in tokens if len(token) > 4]
    tokens = [token for token in tokens if token not in en_stop]
    tokens = [get_lemma(token) for token in tokens]
    return tokens


@app.route('/<query>/<videoID>', methods=['GET'])
def getJSON(videoID, query):
    items = dict()
    if query in final_stopWords:  #if the query is not good enough to be searched,return -1
        return (json.dumps(items))
    phrases = getFullPhrase(
        query, getListFromDict(YouTubeTranscriptApi.get_transcript(videoID)))
    print((phrases))
    a = []
    b = []
    c = []

    if len(phrases) == 0:  #if the keyword not found in any phrases
        return (json.dumps(items))

    for x in phrases:
        l, m, n = sample_analyze_entity_sentiment(x, query)
        print(l, m, n)
        if len(l) > 0:
            a.append(l[0])
            b.append(m[0])
            c.append(n[0])

    total2, p, n, nu = totalKeywordscore(a, b, c)
    print(total2)
    temp = {
        "score": str(total2),
        "positive": str(p),
        "negative": str(n),
        "neutral": str(nu)
    }

    return (json.dumps(temp))


# driver function
if __name__ == '__main__':

    app.run(host='0.0.0.0', port='5001', threaded=True, debug=True)
