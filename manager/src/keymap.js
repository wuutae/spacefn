// KeyMap class for each key map item.
class KeyMap {
    constructor() {
        this.keyCode = null; // actual trigger key code.
        this.displayKey = null; // display key just for display in configuration page.
        this.targetApp = ""; // target process name for key mapping.
        this.map = {
            // action keys mapped to trigger key
            keyCode: null,  // KeyboardEvent.keyCode. Virtual key code
            displayKey: null,  // KeyboardEvent.key (could be modified)
            // modifier keys for key combination
            modifierKeys: {
                ctrl: false,
                shift: false,
                alt: false,
                win: false,
            },
            // initialize map
            init() {
                this.keyCode = null;
                this.displayKey = null;
                this.modifierKeys.ctrl = false;
                this.modifierKeys.shift = false;
                this.modifierKeys.alt = false;
                this.modifierKeys.win = false;
            },
        };
    }
}

module.exports = KeyMap;