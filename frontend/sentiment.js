// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a, b, i, val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) { return false; }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
        b.innerHTML += arr[i].substr(val.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function (e) {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName("input")[0].value;
          /*close the list of autocompleted values,
          (or any other open lists of autocompleted values:*/
          closeAllLists();
        });
        a.appendChild(b);
      }
    }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
      increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) { //up
      /*If the arrow UP key is pressed,
      decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}


var allW = [];


function chart(p, n, nu) {
  var chart = new CanvasJS.Chart("chartContainer3", {
    // exportEnabled: true,
    backgroundColor: "transparent",
    animationEnabled: true,
    // title:{
    // 	text: "State Operating Funds"
    // },
    legend: {
      fontColor: "black",
      cursor: "pointer",
      itemclick: explodePie
    },
    data: [{
      type: "pie",
      fontColor: "black",
      showInLegend: true,
      toolTipContent: "{name}: <strong>{y}%</strong>",
      indexLabel: "{name} - {y}%",
      dataPoints: [
        { y: p, name: "POSITIVE", exploded: true, color: "limegreen", indexLabelFontColor: "white" },
        { y: n, name: "NEGATIVE", color: "red", indexLabelFontColor: "white" },
        { y: nu, name: "NEUTRAL", color: "gold", indexLabelFontColor: "white" }
      ]
    }]
  });

  // document.getElementById("cooker").style.visibility = "hidden";
  document.getElementById("spinner").style.visibility = "hidden";

  document.getElementById("chartContainer").style.visibility = "visible";
  chart.render();
}

function explodePie(e) {
  if (typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
  } else {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
  }
  e.chart.render();

}

function message(val) { $(".message").text(val); }

var id;
var url;
chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
  url = tabs[0].url;
  id = url.split('v=')[1]
  // alert(id)
});

function fetchwords(id) {
  fetch('http://0.0.0.0:5002/' + id).then(r => r.text()).then(result => {
    // console.log(result)
    var mydata = JSON.parse(result);
    var fl;

    for (fl = 0; fl < mydata.length - 1; fl++) {
      allW.push(mydata[fl].word.split("\n")[0])
    }
    var uniqueArray = [];
    for (fl = 0; fl < allW.length; fl++) {
      if (uniqueArray.indexOf(allW[fl]) === -1) {
        uniqueArray.push(allW[fl]);
      }
    }

    var frequent = document.getElementById('frequent');
    var frequentElement = ''
    console.log(mydata[mydata.length - 1].frequents)
    for (var i = 0; i < mydata[mydata.length - 1].frequents.length; i++) {
      frequentElement += `<a id="${mydata[mydata.length - 1].frequents[i]}" class="badge badge-success" style="font-size: 14px; background-color: lightgreen; color: black">${mydata[mydata.length - 1].frequents[i]}</a> &emsp;`
    }

    // console.log(frequentElement)
    frequent.innerHTML = frequentElement;
    for (var i = 0; i < mydata[mydata.length - 1].frequents.length; i++) {
      document.getElementById(mydata[mydata.length - 1].frequents[i]).addEventListener('click', (e) => {
        document.getElementById('word').value = e.target.innerText;
      })
    }
    autocomplete(document.getElementById("word"), uniqueArray);
  });
}

function fetchda(word, id) {
  //	alert("gdsh");

  fetch('http://0.0.0.0:5001/' + word + '/' + id).then(r => r.text()).then(result => {
    var mydata = JSON.parse(result);


    var p = parseFloat(mydata.positive) * 100.0;
    var n = parseFloat(mydata.negative) * 100.0;
    var nu = parseFloat(mydata.neutral) * 100.0;
    if (result.length != 2) {
      // alert(mydata.length)
      chart(p, n, nu)
    }
    else {
      document.getElementById("spinner").style.visibility = "hidden";
      var temp = document.getElementById('not-found1')
      temp.innerHTML = "<hr>Sentiment cannot be found or determined!"
    }
    // Result now contains the response text, do what you want...
  });
}
var word;



window.addEventListener('load', () => {
  document.getElementById("spinner").style.visibility = "hidden";
  if (url.includes('v=')) {
    var frequent = document.getElementById('frequent');
    frequent.innerHTML = "<h4 class='text-center text-success' id='loading'>Loading wait ...</h4>"
  }


  setTimeout(() => {
    if (url.includes('v=')) {
      fetchwords(id)
    }
  }, 1000)

  document.getElementById('form').addEventListener('submit', function (evt) {
    evt.preventDefault();
    var temp = document.getElementById('not-found1')
    temp.innerHTML = ""

    word = document.getElementById('word').value;
    document.getElementById("chartContainer").style.visibility = "hidden";
    document.getElementById("spinner").style.visibility = "visible";
    // document.getElementById("cooker").style.visibility = "visible";
    setTimeout(() => {
      //your code here
      // document.write(word)
      // alert("gfzsjh");
      fetchda(word, id)

    }, 1000)
  })
})
