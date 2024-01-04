#include <windows.h>
#include "KeyMap.h"
#include "KeyboardHookProc.h"
#include <Psapi.h>
#include <iostream>


SpaceFn spaceFn;


// Get active process name
string getForegroundProcessName() {
    HWND foreground = GetForegroundWindow();
    DWORD foregroundProcessId;
    GetWindowThreadProcessId(foreground, &foregroundProcessId);
    HANDLE foregroundProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, foregroundProcessId);
    char foregroundProcessName[MAX_PATH];
    GetModuleBaseNameA(foregroundProcess, nullptr, foregroundProcessName, MAX_PATH);
    CloseHandle(foregroundProcess);

    return foregroundProcessName;
}

// SendInput overloading
bool SendInput(WORD vkCode, bool ctrl, bool shift, bool alt, bool win) {
    vector<INPUT> input;

    auto addKey = [&](WORD keyVk, DWORD flags = 0) {
        INPUT keyDown = {};
        keyDown.type = INPUT_KEYBOARD;
        keyDown.ki.wVk = keyVk;
        keyDown.ki.dwFlags = flags;

        // Set KEYEVENTF_EXTENDEDKEY flag for extended keys
        switch (keyVk) {
            case VK_RMENU:
            case VK_RCONTROL:
            case VK_INSERT:
            case VK_DELETE:
            case VK_HOME:
            case VK_END:
            case VK_PRIOR:
            case VK_NEXT:
            case VK_LEFT:
            case VK_UP:
            case VK_RIGHT:
            case VK_DOWN:
            case VK_NUMLOCK:
            case VK_SNAPSHOT:
                keyDown.ki.dwFlags |= KEYEVENTF_EXTENDEDKEY;
                break;
            default:
                break;
        }

        input.push_back(keyDown);
    };

    if (ctrl) addKey(VK_CONTROL);
    if (shift) addKey(VK_SHIFT);
    if (alt) addKey(VK_MENU);
    if (win) addKey(VK_LWIN);
    addKey(vkCode);

    addKey(vkCode, KEYEVENTF_KEYUP);
    if (win) addKey(VK_LWIN, KEYEVENTF_KEYUP);
    if (alt) addKey(VK_MENU, KEYEVENTF_KEYUP);
    if (shift) addKey(VK_SHIFT, KEYEVENTF_KEYUP);
    if (ctrl) addKey(VK_CONTROL, KEYEVENTF_KEYUP);

    spaceFn.onSendInput = true;  // prevent KeyboardHookProc from calling SendInput below
    auto result = SendInput(static_cast<UINT>(input.size()), input.data(), sizeof(INPUT)) == input.size();
    spaceFn.onSendInput = false;

    return result;
}


// Keyboard hook procedure
LRESULT CALLBACK KeyboardHookProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode != HC_ACTION or spaceFn.onSendInput) return CallNextHookEx(nullptr, nCode, wParam, lParam);

    auto* pKeyboardStruct = (KBDLLHOOKSTRUCT*)lParam;
    if (pKeyboardStruct->vkCode == VK_SPACE) {
        switch (wParam) {
            case WM_KEYDOWN:
            case WM_SYSKEYDOWN:
                if (not spaceFn.onPress) {
                    spaceFn.onPress = true;
                    spaceFn.onPressTimestamp = GetTickCount();
                }
                return 1;
            case WM_KEYUP:
            case WM_SYSKEYUP:
                if (spaceFn.onPress) {
                    if (!spaceFn.executed) SendInput(VK_SPACE, false, false, false, false);
                    spaceFn.onPress = spaceFn.executed = spaceFn.activated = false;
                }
                return 1;
            default:
                break;
        }
    }
    else if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
        // Key down while space key is pressed
        if (spaceFn.onPress) {
            // Activate SpaceFn if space key is pressed over the threshold time
            if (!spaceFn.activated && GetTickCount() - spaceFn.onPressTimestamp >= spaceFn.threshold) spaceFn.activated = true;

            switch (pKeyboardStruct->vkCode) {
                // Keys to activate SpaceFn immediately
                case VK_TAB:
                case VK_OEM_1:
                    spaceFn.activated = true;
                    return 1;
                // Modifier keys
                case VK_CONTROL:
                case VK_LCONTROL:
                case VK_RCONTROL:
                case VK_SHIFT:
                case VK_LSHIFT:
                case VK_RSHIFT:
                case VK_MENU:
                case VK_LMENU:
                case VK_RMENU:
                case VK_LWIN:
                case VK_RWIN:
                    return CallNextHookEx(nullptr, nCode, wParam, lParam);
                default:
                    break;
            }

            if (spaceFn.activated) {
                const string processName = getForegroundProcessName();
                KeyMap keyMap = keyMaps[make_pair(pKeyboardStruct->vkCode, processName)]; // Find a keymap with the process name.
                if (!keyMap.keyCode) (keyMap = keyMaps[make_pair(pKeyboardStruct->vkCode, "")]);  // Find a keymap in global.
                // If the key is mapped, send the mapped key and return 1.
                if (keyMap.keyCode) {
                    const auto map = keyMap.map;
                    SendInput(map.keyCode, map.modifierKeys.ctrl, map.modifierKeys.shift, map.modifierKeys.alt,
                              map.modifierKeys.win);
                    spaceFn.executed = true;
                    return 1;
                }
            }

            // Space key up
            spaceFn.onPress = false;
            SendInput(VK_SPACE, false, false, false, false);
        }
    }

    // Call next hook
    return CallNextHookEx(nullptr, nCode, wParam, lParam);
}
