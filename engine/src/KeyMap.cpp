#include "KeyMap.h"


map<pair<int, string>, KeyMap> keyMaps;

// keyCode 0 means key mapping with the keyCode does not exist.
KeyMap::KeyMap() : keyCode(0), map{0, "", {false, false, false, false}} {}

KeyMap::KeyMap(const nlohmann::json& jsonData) {
    keyCode = jsonData["keyCode"].get<int>();
    displayKey = jsonData["displayKey"].get<string>();
    targetApp = jsonData["targetApp"].get<string>();

    const nlohmann::json& mapData = jsonData["map"];
    map.keyCode = mapData["keyCode"].get<int>();
    map.displayKey = mapData["displayKey"].get<string>();

    const nlohmann::json& modifierKeysData = mapData["modifierKeys"];
    map.modifierKeys.ctrl = modifierKeysData.value("ctrl", false);
    map.modifierKeys.shift = modifierKeysData.value("shift", false);
    map.modifierKeys.alt = modifierKeysData.value("alt", false);
    map.modifierKeys.win = modifierKeysData.value("win", false);
}