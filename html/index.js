console.log("test")
var configPath = "/config.json"

function drawTable(firstMostRecentReportDate, previousWeekReportDate){
  var fullFinishedScores = {}
  fullFinishedScores["firstMostRecentReportDate"] = firstMostRecentReportDate["timestamp"];
  fullFinishedScores["previousWeekReportDate"] = previousWeekReportDate["timestamp"];
  fullFinishedScores["scores"] = []
  for (const player in firstMostRecentReportDate["scores"]) {
    var playerData = {}
    var firstMostRecentReportDate_player = firstMostRecentReportDate["scores"][player]
    var previousWeekReportDate_player = previousWeekReportDate["scores"][player]
    playerData["name"] = firstMostRecentReportDate_player.name
    playerData["firstMostRecentReportDate_position"] = firstMostRecentReportDate_player.position
    playerData["previousWeekReportDate_position"] = previousWeekReportDate_player.position
    playerData["firstMostRecentReportDate_score"] = firstMostRecentReportDate_player.score
    playerData["previousWeekReportDate_score"] = previousWeekReportDate_player.score
    playerData["score_points_delta"] = parseInt(firstMostRecentReportDate_player.score) - parseInt(previousWeekReportDate_player.score)
    playerData["score_percentage_delta"] = Math.round((playerData["score_points_delta"] / parseInt(previousWeekReportDate_player.score)) * 100)
    fullFinishedScores["scores"].push(playerData)

  }
  console.log(fullFinishedScores)

  var tableID = "#scoresTable";
  var scoresTable = $(tableID).DataTable({
    "data": fullFinishedScores["scores"],
    autoWidth: false,
    searching: true,
    stateSave: true,
    "pageLength": 25,
    "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
    "order": [
      [5, "desc"]
    ],
    "columns": [
    {
      "data": "name"
    }, {
      "data": "firstMostRecentReportDate_position"
    }, {
      "data": "previousWeekReportDate_position"
    }, {
      "data": "firstMostRecentReportDate_score"
    }, {
      "data": "previousWeekReportDate_score"
    }, {
      "data": "score_points_delta"
    }, {
      "data": "score_percentage_delta"
    }],
    columnDefs: [
      {
      targets: 0,
      "width": "25%"
      },
      {
      targets: 1,
      "width": "5%"
      },
      {
      targets: 2,
      "width": "5%"
      },
      {
      targets: 3,
      "width": "10%"
      },
      {
      targets: 4,
      "width": "10%"
      },
      {
      targets: 5
      },
      {
      targets: 6
      }
    ],
    "initComplete": function(settings) {
        //saveUsersChildStates();
        //reloadUsersTable();
        $(tableID).attr("style", "width: 100%");
    }
    });


}
function getReports(config, firstMostRecentReportDate, previousWeekReportDate){
  var req_get_firstMostRecentReportDate = new XMLHttpRequest();
  req_get_firstMostRecentReportDate.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var firstMostRecentReportJson = JSON.parse(req_get_firstMostRecentReportDate.responseText);
      console.log(firstMostRecentReportJson);
      var req_get_previousWeekReportDate = new XMLHttpRequest();
      req_get_previousWeekReportDate.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          var previousWeekReportJson = JSON.parse(req_get_previousWeekReportDate.responseText);
          console.log(previousWeekReportJson);
          drawTable(firstMostRecentReportJson, previousWeekReportJson);
        }
      };
      req_get_previousWeekReportDate.open("GET", "/" + config["dataPath"] + config["reportFilesPath"] + previousWeekReportDate + ".json", true);
      req_get_previousWeekReportDate.send();
    }
  };
  req_get_firstMostRecentReportDate.open("GET", "/" + config["dataPath"] + config["reportFilesPath"] + firstMostRecentReportDate + ".json", true);
  req_get_firstMostRecentReportDate.send();
}
window.onload = function(){
  var req_get_config = new XMLHttpRequest();
  req_get_config.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var config = JSON.parse(req_get_config.responseText);


      //get register
      var req_get_register = new XMLHttpRequest();
      req_get_register.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          var responseJson = JSON.parse(req_get_register.responseText);
          console.log(responseJson)
          var firstMostRecentReportStr = responseJson["times"][responseJson["times"].length - 1];
          var previousWeekReportStr = responseJson["times"][responseJson["times"].length - 2];
          var firstMostRecentReportDate = new Date(responseJson["times"][responseJson["times"].length - 1] * 1000);
          var previousWeekReportDate = new Date(responseJson["times"][responseJson["times"].length - 2] * 1000);
          document.getElementById("firstMostRecentReportDate").textContent = firstMostRecentReportDate;
          document.getElementById("previousWeekReportDate").textContent = previousWeekReportDate;

          getReports(config, firstMostRecentReportStr, previousWeekReportStr);
        }
      };
      req_get_register.open("GET","/" + config["dataPath"] + config["registerFilePath"], true);
      req_get_register.send();
    }
  };
  req_get_config.open("GET", configPath, true);
  req_get_config.send();
}
