#!/usr/bin/env python3

import requests
import json
import xml.etree.ElementTree as ET
from pathlib import Path
import os
import sys

"""
:category
	1 - Player
	2 - Alliance
:type
	0 - Total
	1 - Economy
	2 - Research
	3 - Military
	4 - Military Lost
	5 - Military Built
	6 - Military Destoyed
	7 - Honor
"""
scoreTypes = ["total", "economy", "research", "military", "militaryLost", "militaryBuilt", "militaryDestroyed", "honor"]
scoreIDs = {
	"total": 0,
	"economy": 1,
	"research": 2,
	"military": 3,
	"militaryLost": 4,
	"militaryBuilt": 5,
	"militaryDestroyed": 6,
	"honor": 7
}




def loadConfig():
	configFilePath = "html/config.json"
	configFile = Path(configFilePath)
	if(configFile.is_file() == False):
		sampleConfig = {
		  "alliance": 1,
		  "server": 1,
		  "language":"en",
		  "galaxyCount": 9,
		  "solarSystemCount": 499,
		  "numberCount": 15,
		  "webPath":"html/",
		  "registerFilePath":"register.json",
		  "dataPath":"data/",
		  "reportFilesPath":"reports/"
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



def createDir(dirPath):
	try:
		os.mkdir(dirPath)
	except OSError as e:
		print("OSError occurred in createDir(dirPath)")
		print(e.errno)
		print(e.filename)
		print(e.strerror)
		return False
	else:
		return True

def dirOrFileExists(dirPath):
	return os.path.exists(dirPath)

def loadRegister():
	registerFile = Path(config["webPath"] + config["dataPath"] + config["registerFilePath"])
	if(registerFile.is_file() == False):
		sampleRegister = {}
		for scoreType in scoreTypes:
			sampleRegister[scoreType] = {}
			sampleRegister[scoreType]["times"] = []
		registerFile = open(config["webPath"] + config["dataPath"] + config["registerFilePath"], "w")
		registerFile.write(json.dumps(sampleRegister, indent=2))
		registerFile.close()
		print("register file did not exist, created")
		return sampleRegister
	else:
		registerFile = open(config["webPath"] + config["dataPath"] + config["registerFilePath"], "r")
		registerFileContent = registerFile.read()
		registerFile.close()
		return json.loads(registerFileContent)



def getPlayersFromAlliance(allianceXML, allianceID): # alliances xml string, and alliance id
	allianceXML_parsed = ET.fromstring(allianceXML)
	players = []
	for alliance in allianceXML_parsed:
		if(int(alliance.attrib["id"]) == allianceID):
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

		if("status" in player.attrib):
			namesJSON[playerID]["status"] = player.attrib["status"]
		else:
			namesJSON[playerID]["status"] = False

		if("alliance" in player.attrib):
			namesJSON[playerID]["alliance"] = player.attrib["alliance"]
		else:
			namesJSON[playerID]["alliance"] = False

	return namesJSON


def updateAllianceStats():
	#START

	#create necessary directories
	if(not dirOrFileExists(config["webPath"] + config["dataPath"])):
		if(createDir(config["webPath"] + config["dataPath"]) == False):
			exit(0)

	if(not dirOrFileExists(config["webPath"] + config["dataPath"] + config["reportFilesPath"])):
		if(createDir(config["webPath"] + config["dataPath"] + config["reportFilesPath"]) == False):
			exit(0)


	registerFile = loadRegister()

	req_get_alliance = requests.get("https://s{}-{}.ogame.gameforge.com/api/alliances.xml".format(config["server"], config["language"]))

	players = getPlayersFromAlliance(req_get_alliance.content, config["alliance"])


	# get all 8 types of scores

	allScores = {}

	for scoreType in scoreTypes:
		scores = requests.get("https://s{}-{}.ogame.gameforge.com/api/highscore.xml?category=1&type={}".format(config["server"], config["language"], scoreIDs[scoreType]))
		allScores[scoreType] = getPlayersScores(scores.content, players)







	req_get_players = requests.get("https://s{}-{}.ogame.gameforge.com/api/players.xml".format(config["server"], config["language"]))

	playersNames = getPlayersNames(req_get_players.content)


	# crossData, generate json from alliance with current scores of players with each players names

	alliancePlayers = {}
	alliancePlayers["scores"] = {}

	for scoreType in scoreTypes:
		alliancePlayers["scores"][scoreType] = {}
		alliancePlayers["scores"][scoreType]["timestamp"] = allScores[scoreType]["timestamp"]
		alliancePlayers["scores"][scoreType]["players"] = {}

		for playerID in players:
			alliancePlayers["scores"][scoreType]["players"][playerID] = {}
			alliancePlayers["scores"][scoreType]["players"][playerID]["name"] = playersNames[playerID]["name"]
			alliancePlayers["scores"][scoreType]["players"][playerID]["position"] = allScores[scoreType]["scores"][playerID]["position"]
			alliancePlayers["scores"][scoreType]["players"][playerID]["score"] = allScores[scoreType]["scores"][playerID]["score"]




	#store the data
	registerFile = open(config["webPath"] + config["dataPath"] + config["registerFilePath"], "r")
	registerFileContent = registerFile.read()
	registerFile.close()
	register = json.loads(registerFileContent)

	#if time does not exist add it
	for scoreType in scoreTypes:

		timeAlreadyExists = False
		for time in register[scoreType]["times"]:
			if(time == alliancePlayers["scores"][scoreType]["timestamp"]):
				timeAlreadyExists = True

		if(timeAlreadyExists == False):
			register[scoreType]["times"].append(alliancePlayers["scores"][scoreType]["timestamp"])

	registerFile = open(config["webPath"] + config["dataPath"] + config["registerFilePath"], "w")
	registerFile.write(json.dumps(register, indent=2))
	registerFile.close()

	for scoreType in scoreTypes:
		print(scoreType)
		alliancePlayersReportFileName = config["webPath"] + config["dataPath"] + config["reportFilesPath"] + scoreType + "_" +  alliancePlayers["scores"][scoreType]["timestamp"] + ".json"
		f = open(alliancePlayersReportFileName, "w")
		f.write(json.dumps(alliancePlayers["scores"][scoreType], indent=2))
		f.close()


	print("done!")


def updateUniverseData():
	req_get_universe = requests.get("https://s{}-{}.ogame.gameforge.com/api/universe.xml".format(config["server"], config["language"]))
	universeXML_parsed = ET.fromstring(req_get_universe.content)
	universeJson = {}

	for planet in universeXML_parsed:

		playerID = planet.attrib["player"]
		planetID = planet.attrib["id"]

		if(playerID not in universeJson):
			universeJson[playerID] = {}

		if("planets" not in universeJson[playerID]):
			universeJson[playerID]["planets"] = {}

		if(planetID not in universeJson[playerID]["planets"]):
			universeJson[playerID]["planets"][planetID] = {}

		coords = planet.attrib["coords"].split(":")
		universeJson[playerID]["planets"][planetID]["name"] = planet.attrib["name"]
		universeJson[playerID]["planets"][planetID]["coords"] = {}
		universeJson[playerID]["planets"][planetID]["coords"]["galaxy"] = coords[0]
		universeJson[playerID]["planets"][planetID]["coords"]["solarSystem"] = coords[1]
		universeJson[playerID]["planets"][planetID]["coords"]["number"] = coords[2]

		for moon in planet:

			universeJson[playerID]["planets"][planetID]["moon"] = {}
			universeJson[playerID]["planets"][planetID]["moon"]["id"] = moon.attrib["id"]
			universeJson[playerID]["planets"][planetID]["moon"]["name"] = moon.attrib["name"]
			universeJson[playerID]["planets"][planetID]["moon"]["size"] = moon.attrib["size"]


	universeFile = open(config["webPath"] + config["dataPath"] + "universe.json", "w")
	universeFile.write(json.dumps(universeJson, indent=2))
	universeFile.close()


	req_get_players = requests.get("https://s{}-{}.ogame.gameforge.com/api/players.xml".format(config["server"], config["language"]))

	playersJson = getPlayersNames(req_get_players.content)




	playersFile = open(config["webPath"] + config["dataPath"] + "players.json", "w")
	playersFile.write(json.dumps(playersJson, indent=2))
	playersFile.close()

for i in range(0, len(sys.argv)):
	if(sys.argv[i] == "-alliance"):
		updateAllianceStats()
	if(sys.argv[i] == "-universe"):
		updateUniverseData()
