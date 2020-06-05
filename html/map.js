//https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {

  var start = polarToCartesian(x, y, radius, endAngle);
  var end = polarToCartesian(x, y, radius, startAngle);

  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  var d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");

  return d;
}
////////////////////////////////////////////////////////////////////////////////

var configPath = "/config.json"
var config;
var universeJson = undefined;
var playersJson = undefined;
var alliancePlayers;

var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var vw = w / 100;
var vh = h / 100;
console.log("vw: " + vw)
console.log("vh: " + vh)





function renderGalaxyCircleMap() {
  var mapHeight = document.getElementById("galaxyCircleMap").clientHeight
  var mapWidth = document.getElementById("galaxyCircleMap").clientWidth
  var mapSvg = document.getElementById('galaxyCircleMapSvg');
  var mapLabels = document.getElementById('galaxyCircleMapLabels');
  var circleRadiousFitSize = mapHeight > mapWidth ? mapWidth : mapHeight;
  //console.log("circleRadiousFitSize: " + circleRadiousFitSize)

  var strokeWidth = circleRadiousFitSize / 5;
  //console.log("strokeWidth: " + strokeWidth)
  var galaxyMarkerWidth = 10;
  var arcSeparatorDegrees = 0.5;
  var planetWidthDegrees = 2 / 5;
  var arcDegrees = 360 / config["galaxyCount"];


  //var colorsDebug = ["red", "green", "pink", "blue", "purple", "orange", "grey", "cyan", "yellow"];
  for (var galaxyIndex = 0; galaxyIndex < config["galaxyCount"]; galaxyIndex++) {
    var circle = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    var circleCenterX = mapWidth / 2;
    var circleCenterY = mapHeight / 2;
    var circleRad = (circleRadiousFitSize / 2) - (strokeWidth / 2);
    var circleStartAngle = arcDegrees * galaxyIndex + (arcSeparatorDegrees / 2);
    var circleEndAngle = arcDegrees + circleStartAngle - (arcSeparatorDegrees / 2);
    circle.setAttribute("d", describeArc(circleCenterX, circleCenterY, circleRad, circleStartAngle, circleEndAngle));
    //circle.style.stroke = colorsDebug[galaxyNum];
    circle.style.stroke = "black";
    circle.style.strokeWidth = strokeWidth;
    circle.style.fill = "transparent";
    circle.classList.add("hoverGalaxy");


    mapSvg.appendChild(circle);


    var galaxyIDMarker = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    var galaxyIDMarkerRad = circleRad - (strokeWidth / 2) - (galaxyMarkerWidth / 2);
    galaxyIDMarker.setAttribute("d", describeArc(circleCenterX, circleCenterY, galaxyIDMarkerRad, circleStartAngle, circleEndAngle));
    //circle.style.stroke = colorsDebug[galaxyNum];
    galaxyIDMarker.style.stroke = "gray";
    galaxyIDMarker.style.strokeWidth = galaxyMarkerWidth;
    galaxyIDMarker.style.fill = "transparent";


    mapSvg.appendChild(galaxyIDMarker);


    //idk why marks do not appear centered, so i had to add offsets :(
    var offsetX = -10;
    var offsetY = -13;


    var galaxyID = document.createElement("span");
    galaxyID.textContent = galaxyIndex + 1;
    galaxyID.style.position = "absolute";

    var galaxyIDMarkPos = polarToCartesian(circleCenterX + offsetX, circleCenterY + offsetY, circleRad - strokeWidth / 2 - galaxyMarkerWidth * 2 - 5, circleStartAngle + (circleEndAngle - circleStartAngle) / 2)
    galaxyID.style.top = (galaxyIDMarkPos.y) + "px";
    galaxyID.style.left = (galaxyIDMarkPos.x) + "px";
    galaxyID.classList.add("h4");

    mapLabels.appendChild(galaxyID);



    var solarSystemStartID = document.createElement("span");
    solarSystemStartID.textContent = "1";
    solarSystemStartID.style.position = "absolute";

    var solarSystemStartPos = polarToCartesian(circleCenterX + offsetX, circleCenterY + offsetY, circleRad + (strokeWidth / 2) + 25, circleStartAngle + 3)
    solarSystemStartID.style.top = (solarSystemStartPos.y) + "px";
    solarSystemStartID.style.left = (solarSystemStartPos.x) + "px";
    solarSystemStartID.classList.add("h5");

    mapLabels.appendChild(solarSystemStartID);

    var solarSystemEndID = document.createElement("span");
    solarSystemEndID.textContent = config["solarSystemCount"];
    solarSystemEndID.style.position = "absolute";

    var solarSystemEndPos = polarToCartesian(circleCenterX + offsetX, circleCenterY + offsetY, circleRad + (strokeWidth / 2) + 25, circleEndAngle - 3)
    solarSystemEndID.style.top = (solarSystemEndPos.y) + "px";
    solarSystemEndID.style.left = (solarSystemEndPos.x) + "px";
    solarSystemEndID.classList.add("h5");

    mapLabels.appendChild(solarSystemEndID);

  }


  //draw players planets
  for (const player in alliancePlayers) {
    for (const planet in alliancePlayers[player]["planets"]) {
      var currentPlanet = alliancePlayers[player]["planets"][planet]
      var planetMark = document.createElementNS("http://www.w3.org/2000/svg", 'path');
      var planetMarkStrokeWidth = strokeWidth / config["numberCount"];
      var minCoord = ((circleRadiousFitSize / 2) - strokeWidth);
      var maxCoord = circleRadiousFitSize / 2;
      var planetMarkRad = minCoord + (strokeWidth * (currentPlanet["coords"]["number"] / config["numberCount"])) - (planetMarkStrokeWidth / 2);

      //var planetMarkRad = ((circleRadiousFitSize / 2) - ((circleRadiousFitSize - strokeWidth) * (currentPlanet["coords"]["number"] / config["numberCount"])));
      //planetMarkRad = planetMarkRad - (circleRadiousFitSize - (strokeWidth))


      var planetMarkStartAngle = ((arcDegrees * (currentPlanet["coords"]["galaxy"] - 1)) + (arcDegrees * (currentPlanet["coords"]["solarSystem"] / config["solarSystemCount"])) - planetWidthDegrees);
      var planetMarkEndAngle = planetMarkStartAngle + (1 / config["solarSystemCount"]) + planetWidthDegrees;
      planetMark.setAttribute("d", describeArc(circleCenterX, circleCenterY, planetMarkRad, planetMarkStartAngle, planetMarkEndAngle));
      //circle.style.stroke = colorsDebug[galaxyNum];
      planetMark.style.stroke = "green";
      planetMark.style.strokeWidth = planetMarkStrokeWidth;
      planetMark.style.fill = "transparent";
      planetMark.id = "galaxyCircleMapSvg_" + player + "_" + planet
      planetMark.classList.add("hoverPlanet");

      mapSvg.appendChild(planetMark);


      document.getElementById(planetMark.id).addEventListener("mouseover", function(event) {
        if (document.getElementById("galaxyCircleMapLabels_planetData") !== undefined) {
          if (document.getElementById("galaxyCircleMapLabels_planetData").attributes["data-previousPlanetID"] != undefined) {
            //console.log("data-previousPlanetID")
            //console.log(document.getElementById("planetData").attributes["data-previousPlanetID"])
            document.getElementById(document.getElementById("galaxyCircleMapLabels_planetData").attributes["data-previousPlanetID"]).style.stroke = "green";
            document.getElementById(event.target.id).style.stroke = "red";
          }
        }
        var planetIDs = event.target.id.split("_")
        var player = alliancePlayers[planetIDs[1]]
        var planet = alliancePlayers[planetIDs[1]]["planets"][planetIDs[2]]
        document.getElementById("galaxyCircleMapLabels_playerName").textContent = player["name"];
        document.getElementById("galaxyCircleMapLabels_planetName").textContent = planet["name"];
        document.getElementById("galaxyCircleMapLabels_planetCoords").textContent = "[" + planet["coords"]["galaxy"] + ":" + planet["coords"]["solarSystem"] + ":" + planet["coords"]["number"] + "]";
        document.getElementById("galaxyCircleMapLabels_planetData").attributes["data-previousPlanetID"] = event.target.id;
      });
    }
  }

}

function renderGalaxySquareMap() {
  var mapHeight = document.getElementById("galaxySquareMap").clientHeight
  var mapWidth = document.getElementById("galaxySquareMap").clientWidth
  var mapSvg = document.getElementById('galaxySquareMapSvg');
  var mapLabels = document.getElementById('galaxySquareMapLabels');

  var galaxyLeftSpacePercentage = 0.07;
  var galaxyWidthPercentage = 1 - galaxyLeftSpacePercentage;
  var galaxyHeight = (mapHeight / config["galaxyCount"]);
  var galaxyWidth = mapWidth * galaxyWidthPercentage;




  //var colorsDebug = ["red", "green", "pink", "blue", "purple", "orange", "grey", "cyan", "yellow"];
  for (var galaxyIndex = 0; galaxyIndex < config["galaxyCount"]; galaxyIndex++) {
    var square = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    square.setAttribute("x", (mapWidth * (1 - galaxyWidthPercentage + galaxyLeftSpacePercentage)) / 2);
    square.setAttribute("y", galaxyHeight * galaxyIndex);
    square.setAttribute("width", galaxyWidth);
    square.setAttribute("height", galaxyHeight);
    square.style.stroke = "white";
    square.style.strokeWidth = 1;
    square.style.fill = "black";
    square.classList.add("hoverGalaxy");

    mapSvg.appendChild(square);



    var galaxyLabelsDiv = document.createElement("div");
    galaxyLabelsDiv.style.height = galaxyHeight + "px";
    galaxyLabelsDiv.style.backgroundColor = "lightGray";
    galaxyLabelsDiv.classList.add("d-flex", "border-top", "border-bottom");

    var galaxyID = document.createElement("span");
    galaxyID.textContent = galaxyIndex + 1;
    galaxyID.classList.add("h1", "align-self-center", "ml-2");

    galaxyLabelsDiv.appendChild(galaxyID);




    var galaxySolarSystemLabelsDiv = document.createElement("div");
    galaxySolarSystemLabelsDiv.style.height = galaxyHeight + "px";
    galaxySolarSystemLabelsDiv.classList.add("justify-content-end", "ml-auto", "mr-2", "d-flex", "flex-column", "text-right");



    var solarSystemStartID = document.createElement("span");
    solarSystemStartID.textContent = "1";

    solarSystemStartID.classList.add("h5");

    galaxySolarSystemLabelsDiv.appendChild(solarSystemStartID);






    var solarSystemEndID = document.createElement("span");
    solarSystemEndID.textContent = config["numberCount"];
    solarSystemEndID.classList.add("mt-auto");


    solarSystemEndID.classList.add("h5");

    galaxySolarSystemLabelsDiv.appendChild(solarSystemEndID);


    galaxyLabelsDiv.appendChild(galaxySolarSystemLabelsDiv);

    mapLabels.appendChild(galaxyLabelsDiv);



  }


  //draw players planets

  var planetMarkHeight = (galaxyHeight / config["galaxyCount"]);
  var planetMarkWidth = (galaxyWidth / config["solarSystemCount"]);

  for (const player in alliancePlayers) {
    for (const planet in alliancePlayers[player]["planets"]) {
      var currentPlanet = alliancePlayers[player]["planets"][planet]
      var planetMark = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
      planetMark.id = "galaxySquareMapSvg_" + player + "_" + planet


      planetMark.setAttribute("x", (mapWidth * (1 - galaxyWidthPercentage + galaxyLeftSpacePercentage) / 2) + (planetMarkWidth * (currentPlanet["coords"]["solarSystem"] - 1)) + planetMarkWidth / 2);
      planetMark.setAttribute("y", (galaxyHeight * (currentPlanet["coords"]["galaxy"] - 1)) + (planetMarkHeight * (currentPlanet["coords"]["number"] - 1)));
      planetMark.setAttribute("width", planetMarkWidth);
      planetMark.setAttribute("height", planetMarkHeight);
      //planetMark.style.stroke = "white";
      //planetMark.style.strokeWidth = 1;
      planetMark.style.fill = "green";

      mapSvg.appendChild(planetMark);


      document.getElementById(planetMark.id).addEventListener("mouseover", function(event) {
        if (document.getElementById("above_galaxySquareMapLabels_planetData") !== undefined) {
          if (document.getElementById("above_galaxySquareMapLabels_planetData").attributes["data-previousPlanetID"] != undefined) {
            //console.log("data-previousPlanetID")
            //console.log(document.getElementById("planetData").attributes["data-previousPlanetID"])
            document.getElementById(document.getElementById("above_galaxySquareMapLabels_planetData").attributes["data-previousPlanetID"]).style.fill = "green";
            document.getElementById(event.target.id).style.fill = "red";
          }
        }
        var planetIDs = event.target.id.split("_")
        var player = alliancePlayers[planetIDs[1]]
        var planet = alliancePlayers[planetIDs[1]]["planets"][planetIDs[2]]
        document.getElementById("above_galaxySquareMapLabels_playerName").textContent = player["name"];
        document.getElementById("above_galaxySquareMapLabels_planetName").textContent = planet["name"];
        document.getElementById("above_galaxySquareMapLabels_planetCoords").textContent = "[" + planet["coords"]["galaxy"] + ":" + planet["coords"]["solarSystem"] + ":" + planet["coords"]["number"] + "]";
        document.getElementById("above_galaxySquareMapLabels_planetData").attributes["data-previousPlanetID"] = event.target.id;


        if (document.getElementById("under_galaxySquareMapLabels_planetData") !== undefined) {
          if (document.getElementById("under_galaxySquareMapLabels_planetData").attributes["data-previousPlanetID"] != undefined) {
            //console.log("data-previousPlanetID")
            //console.log(document.getElementById("planetData").attributes["data-previousPlanetID"])
            document.getElementById(document.getElementById("under_galaxySquareMapLabels_planetData").attributes["data-previousPlanetID"]).style.fill = "green";
            document.getElementById(event.target.id).style.fill = "red";
          }
        }
        var planetIDs = event.target.id.split("_")
        var player = alliancePlayers[planetIDs[1]]
        var planet = alliancePlayers[planetIDs[1]]["planets"][planetIDs[2]]
        document.getElementById("under_galaxySquareMapLabels_playerName").textContent = player["name"];
        document.getElementById("under_galaxySquareMapLabels_planetName").textContent = planet["name"];
        document.getElementById("under_galaxySquareMapLabels_planetCoords").textContent = "[" + planet["coords"]["galaxy"] + ":" + planet["coords"]["solarSystem"] + ":" + planet["coords"]["number"] + "]";
        document.getElementById("under_galaxySquareMapLabels_planetData").attributes["data-previousPlanetID"] = event.target.id;






      });
    }
  }





}

////////////////////////////////////////////////////////////////////////////////

function getUniverseData(calledFromInnerRequest = false) {
  if (universeJson == undefined && calledFromInnerRequest == false) {
    var req_get_universe = new XMLHttpRequest();
    req_get_universe.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        universeJson = JSON.parse(req_get_universe.responseText);
        getUniverseData(true);



      };
    }
    req_get_universe.open("GET", "/" + config["dataPath"] + "universe.json", true);
    req_get_universe.send();
  }

  if (playersJson == undefined && calledFromInnerRequest == false) {
    var req_get_players = new XMLHttpRequest();
    req_get_players.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        playersJson = JSON.parse(req_get_players.responseText);
        getUniverseData(true);



      };
    }
    req_get_players.open("GET", "/" + config["dataPath"] + "players.json", true);
    req_get_players.send();
  }

  if (universeJson != undefined && playersJson != undefined) {
    //draw circleGalaxyRender
    if (Object.keys(universeJson).length != Object.keys(playersJson).length) {
      alert("Object.keys(universeJson).length != Object.keys(playersJson).length");
    }
    alliancePlayers = {}
    for (const player in playersJson) {
      if (playersJson[player]["alliance"] == config["alliance"]) {
        alliancePlayers[player] = {};
        Object.assign(alliancePlayers[player], universeJson[player]);
        alliancePlayers[player]["name"] = playersJson[player]["name"];
        alliancePlayers[player]["status"] = playersJson[player]["status"];
        alliancePlayers[player]["alliance"] = playersJson[player]["alliance"];
      }
    }

    //we now have all alliance players planets positions, draw them now
    renderGalaxyCircleMap();
    renderGalaxySquareMap();
  }

}

window.onload = function() {
  document.getElementById("galaxyCircleMapLabels_planetData").style.marginTop = ((document.getElementById("galaxyCircleMap").clientHeight / 2) - 35) + "px";
  var req_get_config = new XMLHttpRequest();
  req_get_config.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      config = JSON.parse(req_get_config.responseText);
      document.getElementById("above_solarSystemSize").textContent = config["solarSystemCount"];
      document.getElementById("under_solarSystemSize").textContent = config["solarSystemCount"];

      getUniverseData(false);



    };
  }

  req_get_config.open("GET", configPath, true);
  req_get_config.send();
}