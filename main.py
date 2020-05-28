#!/usr/bin/env python3

import requests
import json
import xml.etree.ElementTree as ET
from pathlib import Path



def loadConfig():
    configFilePath = "html/config.json"
    configFile = Path(configFilePath)
    if(configFile.is_file() == False):
        sampleConfig = {
            "alliance":"1",
            "server":"1",
            "language":"en",
            "registerFilePath":"html/data/register.json",
            "reportFilesPath":"html/data/reports/"
        }
        configFile = open(configFilePath, "w")
        configFile.write(json.dumps(sampleConfig, indent=2))
        configFile.close()
        print("config file did not exist, so a sample config was created, please configure it")
        print(json.dumps(sampleConfig, indent=2))
        exit(0)
    else:
        configFile = open(configFilePath, "r")
        configFileContent = configFile.read()
        configFile.close()
        return json.loads(configFileContent)


config = loadConfig()

def loadRegister():
    registerFilePath = "html/register.json"
    registerFile = Path(config["registerFilePath"])
    if(registerFile.is_file() == False):
        sampleRegister = {}
        sampleRegister["times"] = []
        registerFile = open(config["registerFilePath"], "w")
        registerFile.write(json.dumps(sampleRegister, indent=2))
        registerFile.close()
        print("register file did not exist, created")
        return sampleRegister
    else:
        registerFile = open(config["registerFilePath"], "r")
        registerFileContent = registerFile.read()
        registerFile.close()
        return json.loads(registerFileContent)


registerFile = loadRegister()


def getPlayersFromAlliance(allianceXML, allianceID): # alliances xml string, and alliance id
    allianceXML_parsed = ET.fromstring(allianceXML)
    players = []
    for alliance in allianceXML_parsed:
        if(alliance.attrib["id"] == allianceID):
            for player in alliance:
                players.append(player.attrib["id"])
    return players



def getPlayersScores(scoresXML, alliancePlayers): # scores xml string, and array of alliance players
    scoresXML_parsed = ET.fromstring(scoresXML)
    scoresJSON = {} #create a json where scores are stored by player id and then cross it with players, instead of on each score check all players

    for score in scoresXML_parsed:
        playerID = score.attrib["id"]
        scoresJSON[playerID] = {}
        scoresJSON[playerID]["position"] =  score.attrib["position"]
        scoresJSON[playerID]["score"] =  score.attrib["score"]


    alliancePlayersScores = {}
    alliancePlayersScores["timestamp"] = scoresXML_parsed.attrib["timestamp"]
    alliancePlayersScores["scores"] = {}
    for player in alliancePlayers:
        alliancePlayersScores["scores"][player] = scoresJSON[player]

    return alliancePlayersScores

def getPlayersNames(playersXML): # players xml string
    playersXML_parsed = ET.fromstring(playersXML)
    namesJSON = {}

    for player in playersXML_parsed:
        playerID = player.attrib["id"]
        namesJSON[playerID] = {}
        namesJSON[playerID]["name"] =  player.attrib["name"]

    return namesJSON


#START

req_get_alliance = requests.get("https://s{}-{}.ogame.gameforge.com/api/alliances.xml".format(config["server"], config["language"]))

players = getPlayersFromAlliance(req_get_alliance.content, config["alliance"])


req_get_scores = requests.get("https://s{}-{}.ogame.gameforge.com/api/highscore.xml?category=1&type=0".format(config["server"], config["language"]))

alliancePlayersScores = getPlayersScores(req_get_scores.content, players)

req_get_players = requests.get("https://s{}-{}.ogame.gameforge.com/api/players.xml".format(config["server"], config["language"]))

playersNames = getPlayersNames(req_get_players.content)


# crossData, generate json from alliance with current scores of players with each players names

alliancePlayers = {}
alliancePlayers["timestamp"] = alliancePlayersScores["timestamp"]
alliancePlayers["scores"] = {}
for playerID in players:
    alliancePlayers["scores"][playerID] = {}
    alliancePlayers["scores"][playerID]["position"] = alliancePlayersScores["scores"][playerID]["position"]
    alliancePlayers["scores"][playerID]["score"] = alliancePlayersScores["scores"][playerID]["score"]
    alliancePlayers["scores"][playerID]["name"] = playersNames[playerID]["name"]




#store the data
registerFile = open(config["registerFilePath"], "r")
registerFileContent = registerFile.read()
registerFile.close()
register = json.loads(registerFileContent)

#if time does not exist add it
timeAlreadyExists = False
for time in register["times"]:
    if(time == alliancePlayers["timestamp"]):
        timeAlreadyExists = True

if(timeAlreadyExists == False):
    register["times"].append(alliancePlayers["timestamp"])

registerFile = open(config["registerFilePath"], "w")
registerFile.write(json.dumps(register, indent=2))
registerFile.close()


alliancePlayersReportFileName = config["reportFilesPath"] + alliancePlayers["timestamp"] + ".json"
f = open(alliancePlayersReportFileName, "w")
f.write(json.dumps(alliancePlayers, indent=2))
f.close()
