// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// var span_notFound = document.getElementById('not-found');
// span_notFound.innerHTML = "";

var count_row = 0;
var id;
var url;
chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
  url = tabs[0].url;
  if (url.includes('v=')) {
    id = url.split('v=')[1]
  } else if (url.includes('list=')) {
    id = url.split('list=')[1]
  }
  console.log(id);
});

function runCommand(st) {
  // document.write(st)
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
    var url = tabs[0].url
    var index = url.lastIndexOf("#t")
    if (index > 0)
      chrome.tabs.update(tabs[0].id, { url: url.substring(0, index) + "#t=" + st });
    else
      chrome.tabs.update(tabs[0].id, { url: url + "#t=" + st });


  });
}

const insightPill = document.getElementById('insightPill')
insightPill.addEventListener('click', () => {
  fetch('http://0.0.0.0:5001/' + id).then(r => r.text()).then(result => {
    // const insight = document.getElementById('insight');
    // console.log(result)
    var url = chrome.extension.getURL('lda.html');
    chrome.tabs.create({ url: url, active: true });
    // insight.innerHTML = `<a href=${url} target="_blank" class="text-dark">see for more details</a>`;
    // document.getElementById('lda').addEventListener('click', () => {
    //   e.preventDefault();
    //   chrome.tabs.create({ url: "chrome://newtab", active: false });
    //   return false;
    // })
  })
})

function fetchya(word, id) {

  // document.write(word+id)
  if (url.includes('v=')) {
    fetch('http://0.0.0.0:5000/' + word + '/' + id).then(r => r.text()).then(result => {


      var mydata = JSON.parse(result);
      // document.write(mydata.length)
      var i;
      var x = [];

      var table = document.getElementById("tbody");


      if (mydata.length == 0) {
        var temp = document.getElementById('not-found')
        temp.innerHTML = "Word not found in Video, or very trivial. Please try another keyword!"
      } else {
        var span_notFound = document.getElementById('not-found');
        span_notFound.innerHTML = "";
      }



      for (var i = 1; i < mydata.length; i++) {

        var row = table.insertRow(-1);

        var cell2 = row.insertCell(-1);

        var index = mydata[i].phrase.indexOf(word);
        if (index >= 0) {
          mydata[i].phrase = mydata[i].phrase.substring(0, index) + "<mark>" + mydata[i].phrase.substring(index, index + word.length) + "</mark>" + mydata[i].phrase.substring(index + word.length);

        }
        cell2.innerHTML = ". . . " + mydata[i].phrase + " . . .";
        var cell = row.insertCell(-1);
        cell.innerHTML = "<input type = \"button\"  class = \"btn btn-success\" style = \"width: 100%;'font-family: \"Source Sans Pro\"; color: \"#ffffff\";\" id = \"" + mydata[i].timestamp + "\" value = \"" + Math.round((Number(mydata[i].timestamp.substring(0, mydata[i].timestamp.length - 1)) / 60) * 100) / 100 + " min" + "\" onclick = runCommand(" + mydata[i].timestamp + "\">"
        document.getElementById(mydata[i].timestamp).addEventListener("click", function (e) {
          // alert(this.id)
          runCommand(this.id)
        });
        count_row++;

      }
    });


  } else {
    id = url.split('list=')[1];
    const title = document.getElementById('title');
    const tablehead = document.getElementById('tablehead');
    title.innerHTML = "Related videos"
    tablehead.style.display = "none"
    console.log(id)
    fetch('http://0.0.0.0:5000/list/' + word + '/' + id).then(r => r.text()).then(result => {


      var mydata = JSON.parse(result);
      // console.log(mydata)
      // document.write(mydata.length)
      var i;
      var x = [];

      var table = document.getElementById("tbody");


      if (mydata.length == 0) {
        var temp = document.getElementById('not-found')
        temp.innerHTML = "Word not found in Video, or very trivial. Please try another keyword!"
      } else {
        var span_notFound = document.getElementById('not-found');
        span_notFound.innerHTML = "";
      }



      for (var i = 1; i < mydata.items.length; i++) {

        var row = table.insertRow(-1);
        var cell = row.insertCell(-1);
        var cell2 = row.insertCell(-1);

        // var img = document.createElement('img');
        // console.log(mydata.items[i]);
        // img.setAttribute('src', mydata.items[i].thumbnail_url.url);

        cell.innerHTML = `<img src="${mydata.items[i].thumbnail_url.url}" width="100" alt=""/>`;
        cell2.innerHTML = `<a class="text-dark text-justify" href="https://www.youtube.com/watch?v=${mydata.items[i].url}&list=PL3pGy4HtqwD3Ov1J2UBTfsLgxUzUktTAM" id="${mydata.items[i].url}">${mydata.items[i].title}</a>`;
        document.getElementById(mydata.items[i].url).addEventListener("click", function (e) {
          chrome.tabs.update(null, { url: `https://www.youtube.com/watch?v=${this.id}&list=PL3pGy4HtqwD3Ov1J2UBTfsLgxUzUktTAM` });
        });
        count_row++;

      }
    });
  }
}


var word;

window.addEventListener('load', () => {
  document.getElementById('form').addEventListener('submit', function (evt) {
    evt.preventDefault();
    word = document.getElementById('word').value;

    var rowlength = $('#tbody tr').length;
    // alert(rowlength)
    for (var i = 0; i < rowlength; i++) {

      document.getElementById("tbody").deleteRow(0);
      // alert( $('#tbody tr').length)
    }

    var span_notFound = document.getElementById('not-found');
    span_notFound.innerHTML = "<h4 class='text-center text-success' id='loading'>Loading wait ...</h4>";
    setTimeout(() => {
      //your code here
      // document.write(word)
      // document.querySelectorAll('#tbody').remove();
      console.log(id)
      fetchya(word, id)



    }, 1000)
  })
})