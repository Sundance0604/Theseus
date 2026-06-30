const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let mainWindow = null;
let bridgeStarted = false;

function appendPathEntry(entry) {
  if (!entry || !existsSync(entry)) return;
  const delimiter = process.platform === 'win32' ? ';' : ':';
  const pathKey = Object.keys(process.env).find(
    (key) => key.toLowerCase() === 'path',
  ) || 'PATH';
  const entries = String(process.env[pathKey] || '')
    .split(delimiter)
    .filter(Boolean);
  const normalizedEntry = path.normalize(entry).toLowerCase();
  const alreadyPresent = entries.some(
    (candidate) => path.normalize(candidate).toLowerCase() === normalizedEntry,
  );
  if (!alreadyPresent) {
    process.env[pathKey] = [...entries, entry].join(delimiter);
  }
}

function normalizeRuntimeEnvironment() {
  if (process.platform !== 'win32') return;

  const appData = process.env.APPDATA;
  const localAppData = process.env.LOCALAPPDATA;
  const userProfile = process.env.USERPROFILE || app.getPath('home');

  if (userProfile) {
    process.env.USERPROFILE ||= userProfile;
    process.env.HOME ||= userProfile;
  }

  appendPathEntry(appData && path.join(appData, 'npm'));
  appendPathEntry(localAppData && path.join(localAppData, 'Programs', 'nodejs'));
  appendPathEntry(process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'nodejs'));
}

function resolveLocalConfigPath() {
  if (process.env.THESEUS_CONFIG_FILE) return process.env.THESEUS_CONFIG_FILE;

  const cwdConfig = path.resolve(process.cwd(), 'persona_path.json');
  if (existsSync(cwdConfig)) return cwdConfig;

  const devConfig = path.resolve(__dirname, '..', 'persona_path.json');
  if (!app.isPackaged && existsSync(devConfig)) return devConfig;

  const exeSideConfig = path.join(path.dirname(process.execPath), 'persona_path.json');
  if (existsSync(exeSideConfig)) return exeSideConfig;

  const userDataConfig = path.join(app.getPath('userData'), 'persona_path.json');
  if (existsSync(userDataConfig)) return userDataConfig;

  return path.join(process.resourcesPath, 'persona_path.json');
}

async function startBridgeServer() {
  if (bridgeStarted) return;
  bridgeStarted = true;

  normalizeRuntimeEnvironment();

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
      preload: path.resolve(__dirname, 'preload.cjs'),
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
  ipcMain.handle('theseus-window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('theseus-window:close', () => {
    mainWindow?.close();
  });

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
