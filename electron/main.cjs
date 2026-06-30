const { app, BrowserWindow, globalShortcut } = require('electron');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let mainWindow = null;
let bridgeStarted = false;

function resolveLocalConfigPath() {
  if (process.env.THESEUS_CONFIG_FILE) return process.env.THESEUS_CONFIG_FILE;

  const devConfig = path.resolve(__dirname, '..', 'persona_path.json');
  if (!app.isPackaged && existsSync(devConfig)) return devConfig;

  const exeSideConfig = path.join(path.dirname(process.execPath), 'persona_path.json');
  if (existsSync(exeSideConfig)) return exeSideConfig;

  return path.join(process.resourcesPath, 'persona_path.json');
}

async function startBridgeServer() {
  if (bridgeStarted) return;
  bridgeStarted = true;

  process.env.THESEUS_HOST ||= '127.0.0.1';
  process.env.THESEUS_PORT ||= '3099';
  process.env.THESEUS_CONFIG_FILE = resolveLocalConfigPath();
  process.env.THESEUS_DATA_DIR ||= path.join(
    app.getPath('userData'),
    'data',
    'conversations',
  );

  const serverPath = path.resolve(__dirname, '..', 'bridge-server', 'server.js');
  await import(pathToFileURL(serverPath).href);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#1A1A1A',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173');
  }
}

app.whenReady().then(async () => {
  await startBridgeServer();
  createWindow();

  globalShortcut.register('F12', () => {
    mainWindow?.webContents.toggleDevTools();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
