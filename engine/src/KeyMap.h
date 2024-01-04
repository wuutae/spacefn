#pragma once
#include <string>
#include "nlohmann/json.hpp"


using namespace std;


// KeyMap class to store key mapping data
// Valid only if SpaceFn is activated with space bar pressed
class KeyMap {
    public:
        int keyCode;  // KeyboardEvent.keyCode. Virtual key code of trigger key
        string displayKey;  // KeyboardEvent.key (could be modified) for displaying in electron app
        string targetApp;  // Process name to which the key mapping is applied. e.g. "chrome.exe"

        // Action key to be sent when the trigger key is pressed
        struct {
            int keyCode;  // Virtual key code of action key
            string displayKey;  // KeyboardEvent.key value(could be modified) for displaying in electron app

            // Modifier keys to be sent with the action key
            struct {
                bool ctrl;
                bool shift;
                bool alt;
                bool win;
            } modifierKeys{};
        } map;

    KeyMap();
    explicit KeyMap(const nlohmann::json& jsonData);
};


extern map<pair<int, string>, KeyMap> keyMaps;  // key pair: (keyCode, targetApp) -> KeyMap
