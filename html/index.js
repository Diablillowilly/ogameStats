var configPath = "/config.json"
var config;
var reports;
var scoresTable = undefined;

var underDevelopment = false;

function showReportsLoading() {
  document.getElementById("loadReportsStatus").classList.remove("fa-check");
  document.getElementById("loadReportsStatus").classList.add("fa-spinner");
  document.getElementById("loadReportsStatus").classList.add("fa-spin");
}

function showReportsLoaded() {
  document.getElementById("loadReportsStatus").classList.add("fa-check");
  document.getElementById("loadReportsStatus").classList.remove("fa-spinner");
  document.getElementById("loadReportsStatus").classList.remove("fa-spin");
}

function drawTable(firstReportDate, secondReportDate) {
  //console.log("drawTable")
  //console.log(firstReportDate)
  //console.log(secondReportDate)
  var fullFinishedScores = {};
  fullFinishedScores["firstReportDate"] = firstReportDate["timestamp"];
  fullFinishedScores["secondReportDate"] = secondReportDate["timestamp"];
  fullFinishedScores["scores"] = []
  for (const player in firstReportDate["players"]) {
    var playerData = {}
    var firstReportDate_player = firstReportDate["players"][player]
    var secondReportDate_player = secondReportDate["players"][player]
    //console.log("playerData")
    //console.log(firstReportDate_player)
    //console.log(secondReportDate_player)
    playerData["name"] = firstReportDate_player.name
    playerData["firstReportDate_position"] = firstReportDate_player.position
    playerData["secondReportDate_position"] = secondReportDate_player.position
    playerData["firstReportDate_score"] = firstReportDate_player.score
    playerData["secondReportDate_score"] = secondReportDate_player.score
    playerData["score_points_delta"] = parseInt(secondReportDate_player.score) - parseInt(firstReportDate_player.score)
    playerData["score_percentage_delta"] = Math.round((playerData["score_points_delta"] / parseInt(firstReportDate_player.score)) * 100)
    fullFinishedScores["scores"].push(playerData)

  }
  //console.log(fullFinishedScores)

  var tableID = "#scoresTable";
  if (scoresTable == undefined) {
    scoresTable = $(tableID).DataTable({
      "data": fullFinishedScores["scores"],
      autoWidth: false,
      searching: true,
      stateSave: true,
      "pageLength": 25,
      "lengthMenu": [
        [10, 25, 50, -1],
        [10, 25, 50, "All"]
      ],
      "order": [
        [5, "desc"]
      ],
      "columns": [{
        "data": "name"
      }, {
        "data": "firstReportDate_position"
      }, {
        "data": "secondReportDate_position"
      }, {
        "data": "firstReportDate_score"
      }, {
        "data": "secondReportDate_score"
      }, {
        "data": "score_points_delta"
      }, {
        "data": "score_percentage_delta"
      }],
      columnDefs: [{
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
  } else {
    scoresTable.clear().rows.add(fullFinishedScores["scores"]).draw();
  }
  showReportsLoaded();
}

function setReports(selectedScoreType, firstReportDate, secondReportDate) {
  var req_get_firstReportDate = new XMLHttpRequest();
  req_get_firstReportDate.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var firstMostRecentReportJson = JSON.parse(req_get_firstReportDate.responseText);
      //console.log(firstMostRecentReportJson);
      var req_get_secondReportDate = new XMLHttpRequest();
      req_get_secondReportDate.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          var previousWeekReportJson = JSON.parse(req_get_secondReportDate.responseText);
          //console.log(previousWeekReportJson);
          drawTable(firstMostRecentReportJson, previousWeekReportJson);
        }
      };
      req_get_secondReportDate.open("GET", "/" + config["dataPath"] + config["reportFilesPath"] + selectedScoreType + "_" + secondReportDate + ".json", true);
      req_get_secondReportDate.send();
    }
  };
  req_get_firstReportDate.open("GET", "/" + config["dataPath"] + config["reportFilesPath"] + selectedScoreType + "_" + firstReportDate + ".json", true);
  req_get_firstReportDate.send();
}

function prependCero(number) {
  var repsonseStr;
  if (number < 10) {
    repsonseStr = "0" + String(number);
  } else {
    repsonseStr = String(number);
  }
  return repsonseStr;
}

function getReadableDate(unixTime) {
  var date = new Date(unixTime * 1000);
  var dateFormat = String((date.getYear() + 1900) + "/" + prependCero(date.getMonth() + 1) + "/" + prependCero(date.getDate()) + " - " + prependCero(date.getHours()) + ":" + prependCero(date.getMinutes()) /* + ":" + date.getSeconds()*/ );
  return dateFormat;
}

function loadSelects(reports) {
  //console.log(reports)
  var scoreTypeSelect = document.getElementById("scoreTypeSelect")
  var selectedScoreType = scoreTypeSelect.options[scoreTypeSelect.selectedIndex].value;
  var reportsSelect1 = document.getElementById("reportsSelect1");
  var reportsSelect2 = document.getElementById("reportsSelect2");
  //clear selects
  reportsSelect1.innerHTML = "";
  reportsSelect2.innerHTML = "";
  for (var index = reports[selectedScoreType]["times"].length - 1; index >= 0; index--) {
    var reportsSelect1_option = document.createElement("option");
    var reportsSelect2_option = document.createElement("option");
    reportsSelect1_option.text = getReadableDate(reports[selectedScoreType]["times"][index]);
    reportsSelect1_option.value = reports[selectedScoreType]["times"][index];
    reportsSelect2_option.text = getReadableDate(reports[selectedScoreType]["times"][index]);
    reportsSelect2_option.value = reports[selectedScoreType]["times"][index];
    reportsSelect1.add(reportsSelect1_option);
    reportsSelect2.add(reportsSelect2_option);
  }
}


window.onload = function() {
  if (underDevelopment == true) {
    document.getElementById("notice").textContent = "EN DESARROLLO";
    document.getElementById("noticeDesc").textContent = "Es posible que la pagina no funcione correctamente mientras puedas leer este mensaje, probablemente este haciendo mantenimiento, en un rato deberia de estar funcionado otra vez";

  }


  document.getElementById("loadReports").addEventListener("click", function() {
    showReportsLoading();
    var scoreTypeSelect = document.getElementById("scoreTypeSelect")
    var selectedScoreType = scoreTypeSelect.options[scoreTypeSelect.selectedIndex].value;
    var reportsSelect1 = document.getElementById("reportsSelect1");
    var reportsSelect2 = document.getElementById("reportsSelect2");
    var firstReportID = reportsSelect1.options[reportsSelect1.selectedIndex].value;
    var secondReportID = reportsSelect2.options[reportsSelect2.selectedIndex].value;
    //console.log("firstReportID: " + firstReportID)
    //console.log("secondReportID: " + secondReportID)

    document.getElementById("firstReportDate").textContent = getReadableDate(firstReportID);
    document.getElementById("secondReportDate").textContent = getReadableDate(secondReportID);
    setReports(selectedScoreType, firstReportID, secondReportID);




  });
  document.getElementById("scoreTypeSelect").addEventListener("change", function() {
    loadSelects(reports);
  });

  var req_get_config = new XMLHttpRequest();
  req_get_config.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      config = JSON.parse(req_get_config.responseText);


      //get register
      var req_get_register = new XMLHttpRequest();
      req_get_register.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          reports = JSON.parse(req_get_register.responseText);
          loadSelects(reports);
        }
      };
      req_get_register.open("GET", "/" + config["dataPath"] + config["registerFilePath"], true);
      req_get_register.send();
    }
  };
  req_get_config.open("GET", configPath, true);
  req_get_config.send();
}