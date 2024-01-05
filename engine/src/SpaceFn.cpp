#include <iostream>
#include <fstream>
#include <filesystem>
#include <map>
#include <windows.h>
#include <shlobj.h>
#include "KeyMap.h"
#include "KeyboardHookProc.h"


int main() {
    // Get AppData path
    PWSTR path;
    const HRESULT result = SHGetKnownFolderPath(FOLDERID_RoamingAppData, 0, nullptr, &path);
    if (result != S_OK) return 1;
    const wstring appDataPath = path;
    CoTaskMemFree(path);

    // Read config file
    const wstring cPath = appDataPath + L"\\spacefn\\config.sfn";
    string configPath;
    configPath.assign(cPath.begin(), cPath.end());
    ifstream configFile(configPath);
    // Create config file if it does not exist
    if (not filesystem::exists(cPath)) {
        ofstream initFile(configPath);
        // Initialize data
        nlohmann::json initData = {
                {"theme", "light"},
                {"activateDelay", 150},
                {"keyMaps", nlohmann::json::array()} // an empty array for "keyMaps"
        };
        initFile << initData.dump(2);
        initFile.close();
        configFile.open(configPath);
    }

    // Return if configFile is not open
    if (!configFile.is_open()) return 1;

    // Parse KeyMaps and activateDelay
    nlohmann::json jsonData;
    configFile >> jsonData;
    jsonData = nlohmann::json::parse(jsonData.dump());

    // Set activateDelay
    const int activateDelay = jsonData["activateDelay"].get<int>();
    spaceFn.threshold = activateDelay;

    // Create KeyMap map
    for (const auto& keyMapJson : jsonData["keyMaps"]) {
        const KeyMap keyMap(keyMapJson);

        const pair<int, string> pair = make_pair(keyMap.keyCode, keyMap.targetApp);
        keyMaps[pair] = keyMap;
    }

    // Set keyboard hook
    HHOOK hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardHookProc, nullptr, 0);
    if (hKeyboardHook == nullptr) return 1;

    // Message loop
    MSG msg;
    BOOL bRet;
    while( (bRet = GetMessage( &msg, nullptr, 0, 0 )) != 0) {
        if (bRet == -1) return 1;
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    // Unhook keyboard hook
    UnhookWindowsHookEx(hKeyboardHook);

    return 0;
}
