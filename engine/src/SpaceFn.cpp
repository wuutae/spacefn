#include <iostream>
#include <fstream>
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
    const wstring configPath = appDataPath + L"\\spacefn\\config.sfn";
    string filePath;
    filePath.assign(configPath.begin(), configPath.end());
    ifstream jsonFile(filePath);
    if (!jsonFile.is_open()) return 1;

    // Parse KeyMaps and activateDelay
    nlohmann::json jsonData;
    jsonFile >> jsonData;
    if (jsonData.contains("keyMaps")) jsonData = jsonData["keyMaps"];
    if (jsonData.contains("activateDelay")) spaceFn.threshold = jsonData["activateDelay"].get<int>();

    // Create KeyMap map
    for (const auto& jsonDataElem : jsonData) {
        const KeyMap keyMap(jsonDataElem);

        // Ensure that the keyCode is not already present in the map
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
