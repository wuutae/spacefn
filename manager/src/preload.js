const { contextBridge, ipcRenderer } = require("electron");
const KeyMap = require("./keymap.js");

const KEYMAP_CONTAINER_COL_LEN = 5;  // number of columns of row in keymaps container.

// Load data from config file
async function loadData() {
  return await ipcRenderer.invoke("load-data");
}

// Write data to config file
function writeData(jsonString) {
  ipcRenderer.send("write-data", jsonString);
}

// Reload renderer on call
function reloadRendererOnCall(callback) {
  ipcRenderer.on("reload-renderer", callback);
}

const newKeyMap = () => new KeyMap();

// Expose variables and functions to renderer
contextBridge.exposeInMainWorld("electron", {
  newKeyMap,
  KEYMAP_CONTAINER_COL_LEN,
  loadData,
  writeData,
  reloadRendererOnCall,
});
