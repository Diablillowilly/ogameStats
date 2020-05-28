console.log("test")
var configPath = "/config.json"

function drawTable(firstMostRecentReportDate, secondMostRecentReportDate){
  var fullFinishedScores = {}
  fullFinishedScores["firstMostRecentReportDate"] = firstMostRecentReportDate["timestamp"];
  fullFinishedScores["secondMostRecentReportDate"] = secondMostRecentReportDate["timestamp"];
  fullFinishedScores["scores"] = []
  for (const player in firstMostRecentReportDate["scores"]) {
    var playerData = {}
    var firstMostRecentReportDate_player = firstMostRecentReportDate["scores"][player]
    var secondMostRecentReportDate_player = secondMostRecentReportDate["scores"][player]
    playerData["name"] = firstMostRecentReportDate_player.name
    playerData["firstMostRecentReportDate_position"] = firstMostRecentReportDate_player.position
    playerData["secondMostRecentReportDate_position"] = secondMostRecentReportDate_player.position
    playerData["firstMostRecentReportDate_score"] = firstMostRecentReportDate_player.score
    playerData["secondMostRecentReportDate_score"] = secondMostRecentReportDate_player.score
    playerData["score_points_delta"] = parseInt(firstMostRecentReportDate_player.score) - parseInt(secondMostRecentReportDate_player.score)
    playerData["score_percentage_delta"] = Math.round((playerData["score_points_delta"] / parseInt(secondMostRecentReportDate_player.score)) * 100)
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
      "data": "secondMostRecentReportDate_position"
    }, {
      "data": "firstMostRecentReportDate_score"
    }, {
      "data": "secondMostRecentReportDate_score"
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
function getReports(config, firstMostRecentReportDate, secondMostRecentReportDate){
  var req_get_firstMostRecentReportDate = new XMLHttpRequest();
  req_get_firstMostRecentReportDate.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var firstMostRecentReportJson = JSON.parse(req_get_firstMostRecentReportDate.responseText);
      console.log(firstMostRecentReportJson);
      var req_get_secondMostRecentReportDate = new XMLHttpRequest();
      req_get_secondMostRecentReportDate.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          var secondMostRecentReportJson = JSON.parse(req_get_secondMostRecentReportDate.responseText);
          console.log(secondMostRecentReportJson);
          drawTable(firstMostRecentReportJson, secondMostRecentReportJson);
        }
      };
      req_get_secondMostRecentReportDate.open("GET", "/" + config["reportFilesPath"] + secondMostRecentReportDate + ".json", true);
      req_get_secondMostRecentReportDate.send();
    }
  };
  req_get_firstMostRecentReportDate.open("GET", "/" + config["reportFilesPath"] + firstMostRecentReportDate + ".json", true);
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
          var secondMostRecentReportStr = responseJson["times"][responseJson["times"].length - 2];
          var firstMostRecentReportDate = new Date(responseJson["times"][responseJson["times"].length - 1] * 1000);
          var secondMostRecentReportDate = new Date(responseJson["times"][responseJson["times"].length - 2] * 1000);
          document.getElementById("firstMostRecentReportDate").textContent = firstMostRecentReportDate;
          document.getElementById("secondMostRecentReportDate").textContent = secondMostRecentReportDate;

          getReports(config, firstMostRecentReportStr, secondMostRecentReportStr);
        }
      };
      req_get_register.open("GET","/" + config["registerFilePath"], true);
      req_get_register.send();
    }
  };
  req_get_config.open("GET", configPath, true);
  req_get_config.send();
}
