const analytics = document.getElementById('analyticspill');
var id;
var url;
// chrome.tabs
chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
  url = tabs[0].url;
  id = url.split('v=')[1]
});
analytics.addEventListener('click', () => {
  fetch('http://0.0.0.0:5002/plot/' + id).then(r => r.text()).then(result => {
    document.getElementById("chartContainer").style.visibility = "hidden";
    var mydata = JSON.parse(result);
    const likePercent = (Number(mydata.items[0].statistics.likeCount) / (Number(mydata.items[0].statistics.likeCount) + Number(mydata.items[0].statistics.dislikeCount))) * 100;
    const dislikePercent = (Number(mydata.items[0].statistics.dislikeCount) / (Number(mydata.items[0].statistics.likeCount) + Number(mydata.items[0].statistics.dislikeCount))) * 100;
    var chart = new CanvasJS.Chart("chartContainer", {
      exportEnabled: true,
      backgroundColor: "transparent",
      animationEnabled: true,
      title: {
        text: "like and dislike percentage",
        font: "12px"
      },
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
          { y: likePercent, name: "like percentage", exploded: true, color: "lightblue", indexLabelFontColor: "white" },
          { y: dislikePercent, name: "dislike percentage", color: "black", indexLabelFontColor: "white" }
        ]
      }]
    });
    document.getElementById("chartContainer").style.visibility = "visible";
    document.getElementById("spinner1").style.visibility = "hidden";
    chart.render();
  });

  fetch('http://0.0.0.0:5002/compare/' + id).then(res => res.text()).then(response => {
    document.getElementById("chartContainer2").style.visibility = "hidden";
    var mydata = JSON.parse(response);
    console.log(mydata)
    var chart2 = new CanvasJS.Chart("chartContainer2", {
      animationEnabled: true,
      exportEnabled: true,
      title: {
        text: "video comparison"
      },
      axisY: {
        // title: "Videos"
      },
      legend: {
        cursor: "pointer",
        itemclick: toggleDataSeries
      },
      toolTip: {
        shared: true,
        content: toolTipFormatter
      },
      data: [{
        type: "bar",
        showInLegend: true,
        name: "like Count",
        color: "lightgreen",
        dataPoints: [
          { label: mydata[1].v_title.substring(0, 30), y: Number(mydata[1].likeCount) },
          { label: mydata[0].v_title.substring(0, 30), y: Number(mydata[0].likeCount) },
          { label: mydata[2].v_title.substring(0, 30), y: Number(mydata[2].likeCount) },
          { label: mydata[3].v_title.substring(0, 30), y: Number(mydata[3].likeCount) },
          { label: mydata[4].v_title.substring(0, 30), y: Number(mydata[4].likeCount) }
        ]
      },
      {
        type: "bar",
        showInLegend: true,
        name: "dislike count",
        color: "danger",
        dataPoints: [
          { label: mydata[0].v_title.substring(0, 30), y: Number(mydata[0].dislikeCount) },
          { label: mydata[1].v_title.substring(0, 30), y: Number(mydata[1].dislikeCount) },
          { label: mydata[2].v_title.substring(0, 30), y: Number(mydata[2].dislikeCount) },
          { label: mydata[3].v_title.substring(0, 30), y: Number(mydata[3].dislikeCount) },
          { label: mydata[4].v_title.substring(0, 30), y: Number(mydata[4].dislikeCount) }
        ]
      },
      {
        type: "bar",
        showInLegend: true,
        name: "comment count",
        color: "lightblue",
        dataPoints: [
          { label: mydata[0].v_title.substring(0, 30), y: Number(mydata[0].commentCount) },
          { label: mydata[1].v_title.substring(0, 30), y: Number(mydata[1].commentCount) },
          { label: mydata[2].v_title.substring(0, 30), y: Number(mydata[2].commentCount) },
          { label: mydata[3].v_title.substring(0, 30), y: Number(mydata[3].commentCount) },
          { label: mydata[4].v_title.substring(0, 30), y: Number(mydata[4].commentCount) }
        ]
      }]
    });
    document.getElementById("chartContainer2").style.visibility = "visible";
    chart2.render();
    const videoDetails = document.getElementById('videoLink')
    innerHtml = '<ul class="list-group" >'

    for (data of mydata) {
      liElement = `<li class="list-group-item"><a href="https://www.youtube.com/watch?v=${data.v_id}" id="${data.v_id}" target="_blank" class="font-weight-bold">${data.v_title}</a></li>`
      innerHtml += liElement;
    }
    innerHtml += '</ul>'
    console.log(innerHtml)
    videoDetails.innerHTML = innerHtml;

    function toolTipFormatter(e) {
      var str = "";
      var total = 0;
      var str3;
      var str2;
      for (var i = 0; i < e.entries.length; i++) {
        var str1 = "<span style= \"color:" + e.entries[i].dataSeries.color + "\">" + e.entries[i].dataSeries.name + "</span>: <strong>" + e.entries[i].dataPoint.y + "</strong> <br/>";
        total = e.entries[i].dataPoint.y + total;
        str = str.concat(str1);
      }
      str2 = "<strong>" + e.entries[0].dataPoint.label + "</strong> <br/>";
      str3 = "<span style = \"color:Tomato\">Total: </span><strong>" + total + "</strong><br/>";
      return (str2.concat(str)).concat(str3);
    }

    function toggleDataSeries(e) {
      if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      }
      else {
        e.dataSeries.visible = true;
      }
      chart.render();
    }

  })
})

function explodePie(e) {
  if (typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
  } else {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
  }
  e.chart.render();

}