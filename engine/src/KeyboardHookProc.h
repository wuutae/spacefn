#pragma once
#include <windows.h>
#include "KeyMap.h"


// State of SpaceFn
struct SpaceFn {
    BOOL onSendInput;  // Used to prevent invoking keyHookProc from calling original SendInput
    BOOL onPress;  // Flag if space key is pressed
    DWORD onPressTimestamp;  // Timestamp when space key is pressed
    int threshold;  // Threshold time to activate SpaceFn
    BOOL activated;  // Flag if SpaceFn is activated
    BOOL executed;  // Flag if SpaceFn key is executed

    SpaceFn() : onSendInput(FALSE), onPress(FALSE), onPressTimestamp(0), threshold(100), activated(FALSE), executed(FALSE) {}
};


extern SpaceFn spaceFn;

string getForegroundProcessName();  // Get foreground process name
bool SendInput(WORD vkCode, bool ctrl, bool shift, bool alt, bool win);  // SendInput overload
LRESULT CALLBACK KeyboardHookProc(int nCode, WPARAM wParam, LPARAM lParam);  // Keyboard hook procedure
