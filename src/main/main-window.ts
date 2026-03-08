import { BrowserWindow } from 'electron';
import path from 'node:path';
import { getAssetPath } from './assets-path';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;
let allowMainWindowClose = false;

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 18 },
    backgroundColor: '#081027',
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show when ready
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Hide instead of close (tray app pattern)
  mainWindow.on('close', (e) => {
    if (!allowMainWindowClose) {
      e.preventDefault();
      mainWindow?.hide();
      return;
    }

    allowMainWindowClose = false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    allowMainWindowClose = false;
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = `${MAIN_WINDOW_VITE_DEV_SERVER_URL.replace(/\/$/, '')}/main.html`;
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/main.html`));
  }

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function toggleMainWindow(): void {
  if (!mainWindow) {
    createMainWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

export function closeMainWindow(): void {
  if (!mainWindow) {
    return;
  }

  allowMainWindowClose = true;
  mainWindow.close();
}
