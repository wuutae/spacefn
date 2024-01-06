const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("node:path");
const fs = require("fs");


const configPath = path.join(app.getPath("appData"), "spacefn", "config.sfn");  // Path to config file
let manager;  // Electron window
let engine;  // SpaceFn engine


// Create Electron window
const createWindow = () => {
  manager = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 550,
    minHeight: 550,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      nodeIntegration: true,
    },
  });

  // Load index.html
  manager.loadFile("index.html");
}

// Load Electron window
app.whenReady().then(() => {
  loadEngine();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Handle IPC events of loading config file
ipcMain.handle("load-data", async (event, args) => {
  return new Promise((resolve, reject) => {
    fs.readFile(configPath, "utf-8", (err, fileContent) => {
      const parsedData = err ? [] : JSON.parse(fileContent);
      resolve(parsedData);
    });
  });
});

// Handle IPC events of writing config file
ipcMain.on("write-data", async (event, jsonString) => {
  fs.writeFile(configPath, jsonString, "utf-8", (err) => {
    if (err) {
      console.log("error: " + err);
    } else {
      loadEngine();  // Reload engine
      manager.webContents.send("reload-renderer");  // Reload renderer
    }
  });
});

// Load SpaceFn engine
function loadEngine() {
  const exePath = process.env.NODE_ENV?.trim() === 'dev' ?
      "../engine/cmake-build-debug/spacefn_engine.exe" :
      "./resources/spacefn_engine.exe";

  // Kill engine process if it's already running and spawn a new one
  engine && engine.kill("SIGTERM");
  engine = spawn(exePath);

  // Handle engine output
  engine.stdout.on("data", (data) => {
    console.log(`cout: ${data}`);
  });

  // Handle engine error
  engine.on("error", (err) => {
    console.error(`cerr: ${err.message}`);
  });
}
