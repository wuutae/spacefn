  const { app, BrowserWindow, ipcMain, Menu, Tray } = require("electron");
const { spawn } = require("child_process");
const path = require("node:path");
const fs = require("fs");


const configPath = path.join(app.getPath("appData"), "spacefn", "config.sfn");  // Path to config file
let manager;  // Electron window
const engine = {
  process: null,
  intendedShutdown: false
}
let tray;

// Load Electron window
app.whenReady().then(() => {
  // Create window
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
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Load SpaceFn engine
  loadEngine();

  // Create tray
  tray = new Tray("icon.ico");
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => { manager.show(); } },
    { label: 'Enable/Disable', click: () => {
        if (engine.process) {
          engine.intendedShutdown = true;
          engine.process.kill("SIGTERM");
          engine.process = null;
        }
        else {
          loadEngine();
        }
      }
    },
    { label: 'Exit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('SpaceFn is good');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => manager.show());

  // Hide window on close
  manager.on('close', (event) => {
    event.preventDefault();
    manager.hide();
  });

  // Quit app on explicit quit
  app.on('before-quit', () => {
    tray.destroy();
    manager.destroy();
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
      engine.intendedShutdown = true;
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
  engine.process && engine.process.kill("SIGTERM");
  engine.process = spawn(exePath);

  // Handle engine output
  engine.process.stdout.on("data", (data) => {
    console.log(`cout: ${data}`);
  });

  // Handle engine error
  engine.process.on("error", (err) => {
    console.error(`cerr: ${err.message}`);
  });

  engine.process.on("close", () => {
    engine.intendedShutdown || app.quit();
    engine.intendedShutdown = false;
  })

}
